const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Default schema with seed data
db.defaults({
  users: [],
  consultations: [],
  medicine_stock: [],
  followups: []
}).write();

// Seed initial data if empty
function seedIfEmpty() {
  if (db.get('users').value().length === 0) {
    const passwordHash = bcrypt.hashSync('demo1234', 10);
    const workerHash = bcrypt.hashSync('worker123', 10);

    db.get('users').push(
      { id: uuidv4(), name: 'Ramilaben Vasava', phone: '9876543210', role: 'patient', password: passwordHash, village: 'Subir', created_at: new Date().toISOString() },
      { id: uuidv4(), name: 'Bharatbhai Gamit', phone: '9876543211', role: 'patient', password: passwordHash, village: 'Ahwa', created_at: new Date().toISOString() },
      { id: uuidv4(), name: 'Savitaben Chunara', phone: '9876543212', role: 'patient', password: passwordHash, village: 'Waghai', created_at: new Date().toISOString() },
      { id: uuidv4(), name: 'Manjulaben Patel (ASHA)', phone: '9000000001', role: 'worker', password: workerHash, village: 'Subir PHC', created_at: new Date().toISOString() },
      { id: uuidv4(), name: 'Dineshbhai Tadvi (ANM)', phone: '9000000002', role: 'worker', password: workerHash, village: 'Ahwa CHC', created_at: new Date().toISOString() }
    ).write();
  }

  if (db.get('medicine_stock').value().length === 0) {
    const medicines = [
      { id: uuidv4(), name: 'ORS Packets', category: 'Essential', current_stock: 45, min_stock: 50, unit: 'packets', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Paracetamol 500mg', category: 'Essential', current_stock: 120, min_stock: 100, unit: 'tablets', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Iron + Folic Acid', category: 'Maternal', current_stock: 80, min_stock: 150, unit: 'tablets', last_updated: new Date().toISOString(), updated_by: 'Dineshbhai Tadvi' },
      { id: uuidv4(), name: 'Chloroquine', category: 'Malaria', current_stock: 60, min_stock: 80, unit: 'tablets', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Amoxicillin 250mg', category: 'Antibiotic', current_stock: 200, min_stock: 100, unit: 'capsules', last_updated: new Date().toISOString(), updated_by: 'Dineshbhai Tadvi' },
      { id: uuidv4(), name: 'Zinc Tablets', category: 'Maternal', current_stock: 30, min_stock: 100, unit: 'tablets', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Antifungal Cream', category: 'Dermatology', current_stock: 15, min_stock: 20, unit: 'tubes', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Betadine Solution', category: 'Wound Care', current_stock: 8, min_stock: 10, unit: 'bottles', last_updated: new Date().toISOString(), updated_by: 'Dineshbhai Tadvi' },
      { id: uuidv4(), name: 'Vitamin A Capsules', category: 'Child Health', current_stock: 200, min_stock: 100, unit: 'capsules', last_updated: new Date().toISOString(), updated_by: 'Manjulaben Patel' },
      { id: uuidv4(), name: 'Albendazole 400mg', category: 'Deworming', current_stock: 350, min_stock: 200, unit: 'tablets', last_updated: new Date().toISOString(), updated_by: 'Dineshbhai Tadvi' }
    ];
    db.get('medicine_stock').push(...medicines).write();
  }

  if (db.get('followups').value().length === 0) {
    const today = new Date();
    const daysAgo = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); return dt.toISOString(); };
    const daysFromNow = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString(); };

    const followups = [
      { id: uuidv4(), patient_name: 'Ramilaben Vasava', village: 'Subir', age: 34, condition: 'Suspected Malaria', last_visit: daysAgo(14), next_due: daysAgo(2), status: 'overdue', assigned_to: 'Manjulaben Patel', notes: 'Blood smear pending. Was given chloroquine. Follow up for fever persistence.' },
      { id: uuidv4(), patient_name: 'Kamleshbhai Patel', village: 'Ahwa', age: 67, condition: 'Hypertension', last_visit: daysAgo(30), next_due: daysAgo(5), status: 'overdue', assigned_to: 'Dineshbhai Tadvi', notes: 'BP was 160/100 on last visit. Medication adherence to be checked.' },
      { id: uuidv4(), patient_name: 'Sonalben Vasava', village: 'Waghai', age: 24, condition: 'Antenatal Care (7 months)', last_visit: daysAgo(7), next_due: daysFromNow(7), status: 'upcoming', assigned_to: 'Manjulaben Patel', notes: 'Iron levels borderline. Ensure IFA tablets are taken. Weight monitoring needed.' },
      { id: uuidv4(), patient_name: 'Arunbhai Gamit', village: 'Subir', age: 8, condition: 'Acute Diarrhoea', last_visit: daysAgo(4), next_due: daysFromNow(3), status: 'upcoming', assigned_to: 'Manjulaben Patel', notes: 'ORS given. Child recovered well. Final check-up pending.' },
      { id: uuidv4(), patient_name: 'Vimlaben Tadvi', village: 'Dang', age: 45, condition: 'TB Treatment (DOTS)', last_visit: daysAgo(3), next_due: daysFromNow(4), status: 'upcoming', assigned_to: 'Dineshbhai Tadvi', notes: 'Month 4 of treatment. Adherence good. Sputum test due next week.' },
      { id: uuidv4(), patient_name: 'Nareshbhai Chunara', village: 'Ahwa', age: 55, condition: 'Diabetes Type 2', last_visit: daysAgo(20), next_due: daysAgo(6), status: 'overdue', assigned_to: 'Dineshbhai Tadvi', notes: 'Blood sugar was 280 mg/dL. Missed last appointment. Home visit recommended.' },
      { id: uuidv4(), patient_name: 'Pushpaben Vasava', village: 'Waghai', age: 2, condition: 'Severe Acute Malnutrition', last_visit: daysAgo(10), next_due: daysAgo(3), status: 'overdue', assigned_to: 'Manjulaben Patel', notes: 'Weight 7.2kg, MUAC 10.5cm. Referred to NRC. Follow up on admission status.' },
      { id: uuidv4(), patient_name: 'Harshaben Patel', village: 'Subir', age: 29, condition: 'Post-delivery Care', last_visit: daysAgo(2), next_due: daysFromNow(5), status: 'upcoming', assigned_to: 'Manjulaben Patel', notes: 'Normal delivery 2 days ago. Breastfeeding support needed. Newborn exam scheduled.' }
    ];
    db.get('followups').push(...followups).write();
  }
}

seedIfEmpty();

module.exports = db;
