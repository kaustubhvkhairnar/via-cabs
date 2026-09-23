const API_URL = 'https://script.google.com/macros/s/AKfycbx6DLeZ_svRlYYltAyqjvDLlS_hWoaXlNpl5toWMSwxBnc-XljdLRrr1cKISzeS-HMt/exec';

const DRIVER_VEHICLES = {
  Rahul: 'MH12AB1234',
  Akshay: 'MH12CD5678',
  Prasad: 'MH14EF9012'
};

const $ = (id) => document.getElementById(id);
const startCard = $('startCard');
const endCard = $('endCard');
const successCard = $('successCard');
const startForm = $('startForm');
const endForm = $('endForm');
const toast = $('toast');

let activeTrip = null;
let toastTimer;

function nowParts() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-IN', {day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Kolkata'}).format(now);
  const time = new Intl.DateTimeFormat('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata'}).format(now);
  return { date, time };
}

function numberValue(id) {
  const value = parseFloat($(id).value);
  return Number.isFinite(value) ? value : 0;
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show${isError ? ' error' : ''}`;
  toastTimer = setTimeout(() => toast.className = 'toast', 3500);
}

function setProgress(stage) {
  $('stepStart').classList.toggle('active', stage === 'start');
  $('stepEnd').classList.toggle('active', stage === 'end');
}

function updateClockFields() {
  const parts = nowParts();
  if (!activeTrip) {
    $('date').value = parts.date;
    $('startTime').value = parts.time;
  } else {
    $('endTime').value = parts.time;
  }
}

function saveActiveTrip(trip) {
  activeTrip = trip;
  sessionStorage.setItem('viaActiveTrip', JSON.stringify(trip));
}

function loadActiveTrip() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('viaActiveTrip') || 'null');
    if (saved && saved.driver && saved.vehicle && Number.isFinite(Number(saved.startKM))) {
      activeTrip = saved;
      showEndTrip();
    }
  } catch (_) {
    sessionStorage.removeItem('viaActiveTrip');
  }
}

function showEndTrip() {
  $('activeDriver').textContent = activeTrip.driver;
  $('activeVehicle').textContent = activeTrip.vehicle;
  $('activeStart').textContent = `${activeTrip.date} · ${activeTrip.startTime}`;
  updateClockFields();
  startCard.classList.add('hidden');
  endCard.classList.remove('hidden');
  successCard.classList.add('hidden');
  setProgress('end');
}

function showStartTrip() {
  activeTrip = null;
  sessionStorage.removeItem('viaActiveTrip');
  startForm.reset();
  endForm.reset();
  $('vehicle').value = '';
  updateClockFields();
  startCard.classList.remove('hidden');
  endCard.classList.add('hidden');
  successCard.classList.add('hidden');
  setProgress('start');
  $('driver').focus();
}

function updateSummary() {
  const start = activeTrip ? Number(activeTrip.startKM) : 0;
  const end = numberValue('endKM');
  const km = Math.max(0, end - start);
  const collection = numberValue('collection');
  const cng = numberValue('cngCost');
  const toll = numberValue('toll');
  const other = numberValue('otherExpense');
  const litres = numberValue('cngLitres');
  const net = collection - cng - toll - other;
  const perKm = km > 0 ? collection / km : 0;
  const kmPerLitre = litres > 0 ? km / litres : 0;
  $('totalKM').textContent = km.toFixed(1);
  $('netCollection').textContent = `₹${net.toLocaleString('en-IN', {maximumFractionDigits:2})}`;
  $('collectionPerKM').textContent = `₹${perKm.toFixed(2)}`;
  $('kmPerLitre').textContent = kmPerLitre.toFixed(2);
  return { km, net, perKm, kmPerLitre };
}

$('driver').addEventListener('change', (event) => {
  $('vehicle').value = DRIVER_VEHICLES[event.target.value] || '';
});

$('endKM').addEventListener('input', updateSummary);
['collection','cngCost','cngLitres','toll','otherExpense'].forEach(id => $(id).addEventListener('input', updateSummary));

startForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const driver = $('driver').value;
  const vehicle = $('vehicle').value;
  const startKM = Number($('startKM').value);
  const parts = nowParts();

  if (!driver) return showToast('Please select a driver.', true);
  if (!vehicle) return showToast('Vehicle number is missing.', true);
  if (!Number.isFinite(startKM) || startKM < 0) return showToast('Enter a valid start odometer.', true);

  const trip = { driver, vehicle, startKM, date: parts.date, startTime: parts.time };
  const button = startForm.querySelector('button');
  button.disabled = true;
  button.innerHTML = 'Starting…';

  try {
    const params = new URLSearchParams({ action:'start', driver, vehicle, date:trip.date, startTime:trip.startTime, startKM:String(startKM) });
    await fetch(API_URL, { method:'POST', mode:'no-cors', body:params });
    saveActiveTrip(trip);
    showEndTrip();
    showToast('Trip started. Drive safe!');
  } catch (error) {
    showToast('Could not connect. Please try again.', true);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Start Trip <span>→</span>';
  }
});

endForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeTrip) return showToast('No active trip found.', true);
  const endKM = Number($('endKM').value);
  if (!Number.isFinite(endKM) || endKM < activeTrip.startKM) return showToast('End KM must be equal to or higher than Start KM.', true);

  const summary = updateSummary();
  const button = $('submitEndBtn');
  button.disabled = true;
  button.innerHTML = 'Saving…';
  const parts = nowParts();
  $('endTime').value = parts.time;

  const payload = {
    action:'end', driver:activeTrip.driver, vehicle:activeTrip.vehicle, endTime:parts.time,
    endKM:String(endKM), trips:String(Math.max(0, numberValue('trips'))), collection:String(numberValue('collection')),
    cngCost:String(numberValue('cngCost')), cngLitres:String(numberValue('cngLitres')), toll:String(numberValue('toll')),
    otherExpense:String(numberValue('otherExpense')), paymentType:$('paymentType').value, remarks:$('remarks').value
  };

  try {
    const params = new URLSearchParams(payload);
    await fetch(API_URL, { method:'POST', mode:'no-cors', body:params });
    sessionStorage.removeItem('viaActiveTrip');
    activeTrip = null;
    endCard.classList.add('hidden');
    successCard.classList.remove('hidden');
    setProgress('end');
    showToast(`Saved · ${summary.km.toFixed(1)} KM`);
  } catch (error) {
    showToast('Could not save the trip. Please try again.', true);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Submit Trip <span>✓</span>';
  }
});

$('newTripBtn').addEventListener('click', showStartTrip);

setInterval(updateClockFields, 30000);
updateClockFields();
loadActiveTrip();
