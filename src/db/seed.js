const bcrypt = require('bcryptjs');
const pool = require('./pool');

const seedPassword = process.env.SEED_PASSWORD;

if (!seedPassword) {
  throw new Error('SEED_PASSWORD must be defined in .env');
}

const patients = [
  ['Demo', 'Patient01', 'DEMO-PAT-001', '+970000000001'],
  ['Demo', 'Patient02', 'DEMO-PAT-002', '+970000000002'],
  ['Demo', 'Patient03', 'DEMO-PAT-003', '+970000000003'],
  ['Demo', 'Patient04', 'DEMO-PAT-004', '+970000000004'],
  ['Demo', 'Patient05', 'DEMO-PAT-005', '+970000000005'],
  ['Demo', 'Patient06', 'DEMO-PAT-006', '+970000000006'],
  ['Demo', 'Patient07', 'DEMO-PAT-007', '+970000000007'],
  ['Demo', 'Patient08', 'DEMO-PAT-008', '+970000000008'],
  ['Demo', 'Patient09', 'DEMO-PAT-009', '+970000000009'],
  ['Demo', 'Patient10', 'DEMO-PAT-010', '+970000000010'],
  ['Demo', 'Patient11', 'DEMO-PAT-011', '+970000000011'],
  ['Demo', 'Patient12', 'DEMO-PAT-012', '+970000000012'],
  ['Demo', 'Patient13', 'DEMO-PAT-013', '+970000000013'],
  ['Demo', 'Patient14', 'DEMO-PAT-014', '+970000000014'],
  ['Demo', 'Patient15', 'DEMO-PAT-015', '+970000000015'],
  ['Demo', 'Patient16', 'DEMO-PAT-016', '+970000000016'],
  ['Demo', 'Patient17', 'DEMO-PAT-017', '+970000000017'],
  ['Demo', 'Patient18', 'DEMO-PAT-018', '+970000000018'],
  ['Demo', 'Patient19', 'DEMO-PAT-019', '+970000000019'],
  ['Demo', 'Patient20', 'DEMO-PAT-020', '+970000000020'],
];

async function ensureUser(client, user, passwordHash) {
  await client.query(
    `INSERT INTO users (
      first_name,
      last_name,
      national_id_number,
      phone_number,
      email,
      password_hash,
      roles
    )
    VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$7]::user_role[])
    ON CONFLICT (email) DO NOTHING`,
    [
      user.firstName,
      user.lastName,
      user.nationalId,
      user.phone,
      user.email,
      passwordHash,
      user.role,
    ],
  );

  const result = await client.query('SELECT user_id FROM users WHERE email = $1', [user.email]);

  if (result.rowCount !== 1) {
    throw new Error(`Could not find seeded user: ${user.email}`);
  }

  return result.rows[0].user_id;
}

async function seed() {
  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash(seedPassword, 10);

    await client.query('BEGIN');

    // 1. Create the clinic owner account.
    const ownerUserId = await ensureUser(
      client,
      {
        firstName: 'Demo',
        lastName: 'Owner',
        nationalId: 'DEMO-OWNER-001',
        phone: '+970000000101',
        email: 'owner@clinic.example.test',
        role: 'clinic_owner',
      },
      passwordHash,
    );

    await client.query(
      `INSERT INTO clinic_owners (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [ownerUserId],
    );

    const ownerResult = await client.query(
      'SELECT owner_id FROM clinic_owners WHERE user_id = $1',
      [ownerUserId],
    );

    const ownerId = ownerResult.rows[0].owner_id;

    // 2. Create the clinic and its basic settings.
    await client.query(
      `INSERT INTO clinics (
        clinic_name,
        address,
        phone_number,
        email,
        owner_id
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (owner_id) DO NOTHING`,
      ['Demo Clinic', 'Nablus, Palestine', '+970000000100', 'clinic@clinic.example.test', ownerId],
    );

    // 3. Create two doctors.
    const doctors = [
      {
        firstName: 'Demo',
        lastName: 'DoctorOne',
        nationalId: 'DEMO-DOCTOR-001',
        phone: '+970000000102',
        email: 'doctor1@clinic.example.test',
        speciality: 'General Medicine',
        fee: 100,
        duration: 30,
        start: '09:00',
        end: '15:00',
      },
      {
        firstName: 'Demo',
        lastName: 'DoctorTwo',
        nationalId: 'DEMO-DOCTOR-002',
        phone: '+970000000103',
        email: 'doctor2@clinic.example.test',
        speciality: 'Family Medicine',
        fee: 120,
        duration: 30,
        start: '10:00',
        end: '16:00',
      },
    ];

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (const doctor of doctors) {
      const userId = await ensureUser(client, { ...doctor, role: 'doctor' }, passwordHash);

      await client.query(
        `INSERT INTO doctors (
          user_id,
          speciality,
          default_consultation_fee,
          default_slot_duration
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO NOTHING`,
        [userId, doctor.speciality, doctor.fee, doctor.duration],
      );

      const doctorResult = await client.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [
        userId,
      ]);

      const doctorId = doctorResult.rows[0].doctor_id;

      for (const day of dayNames) {
        const isEnabled = !['friday', 'saturday'].includes(day);

        await client.query(
          `INSERT INTO working_hours (
            doctor_id,
            day_of_week,
            is_enabled,
            from_time,
            to_time
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (doctor_id, day_of_week) DO NOTHING`,
          [
            doctorId,
            day,
            isEnabled,
            isEnabled ? doctor.start : null,
            isEnabled ? doctor.end : null,
          ],
        );
      }
    }

    // 4. Create 20 demo patients.
    for (const patient of patients) {
      await client.query(
        `INSERT INTO patients (
          first_name,
          last_name,
          national_id_number,
          phone_number
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (national_id_number) DO NOTHING`,
        patient,
      );
    }

    await client.query('COMMIT');

    console.log('Development seed completed successfully.');
    console.log('Owner, two doctors, schedules, and demo patients are ready.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Development seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
