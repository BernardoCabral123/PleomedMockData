const express = require('express');
const bodyParser = require('body-parser');
const doctors = require('./doctors.json');

const app = express();
app.use(bodyParser.json());

// In-memory storage for appointments
const appointments = {};

// Initialize appointments for each doctor
Object.keys(doctors).forEach((doctorId) => {
  appointments[doctorId] = [];
});

// Get all doctors
app.get('/doctors', (req, res) => {
  res.json(doctors);
});

// Get availability for a specific doctor
app.get('/availability/:doctorId', (req, res) => {
  const doctorId = req.params.doctorId;
  const doctor = doctors[doctorId];

  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const workHours = doctor.work_hours;
  const bookedSlots = appointments[doctorId].map((appointment) => appointment.time);
  const availableSlots = [];

  let start = new Date(`1970-01-01T${workHours.start}:00`);
  const end = new Date(`1970-01-01T${workHours.end}:00`);

  while (start < end) {
    const slot = start.toTimeString().slice(0, 5);
    if (!bookedSlots.includes(slot)) {
      availableSlots.push(slot);
    }
    start = new Date(start.getTime() + 30 * 60 * 1000); // Add 30 minutes
  }

  res.json(availableSlots);
});

// Book an appointment
app.post('/book', (req, res) => {
  const { doctorId, time, patientName } = req.body;

  if (!doctorId || !time || !patientName) {
    return res.status(400).json({ error: 'Missing required fields: doctorId, time, or patientName' });
  }

  const doctor = doctors[doctorId];
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const workHours = doctor.work_hours;
  const appointmentTime = new Date(`1970-01-01T${time}:00`);
  const start = new Date(`1970-01-01T${workHours.start}:00`);
  const end = new Date(`1970-01-01T${workHours.end}:00`);

  if (appointmentTime < start || appointmentTime >= end) {
    return res.status(400).json({ error: 'Time is outside of work hours' });
  }

  const isAlreadyBooked = appointments[doctorId].some((appointment) => appointment.time === time);
  if (isAlreadyBooked) {
    return res.status(400).json({ error: 'Time slot already booked' });
  }

  appointments[doctorId].push({ time, patientName });
  res.json({ message: 'Appointment booked successfully' });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
