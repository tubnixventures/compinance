import { nativeFirestore } from './connectors/firestore';
import { User } from './schema/user';
import { hashPassword } from './utils/crypto';
import { logger } from './utils/logger';

export async function seedInitialData() {
  const usersRef = nativeFirestore.collection<User>('users');
  const snap = await usersRef.get();
  if (snap.docs.length > 0) return;

  const defaultPasswordHash = await hashPassword('Compinance2026!');
  const now = Date.now();

  const seedUsers: User[] = [
    {
      id: 'usr_root_1',
      fullName: 'Chief Technology Architect (Root)',
      email: 'root@compinance.co.ke',
      phone: '+254700000001',
      passwordHash: defaultPasswordHash,
      type: 'staff',
      role: 'root',
      whatsappOptIn: true,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_ceo_1',
      fullName: 'Amina Odhiambo (CEO)',
      email: 'ceo@compinance.co.ke',
      phone: '+254700000002',
      passwordHash: defaultPasswordHash,
      type: 'staff',
      role: 'ceo',
      whatsappOptIn: true,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_admin_1',
      fullName: 'David Kiprono (Admin)',
      email: 'admin@compinance.co.ke',
      phone: '+254700000003',
      passwordHash: defaultPasswordHash,
      type: 'staff',
      role: 'admin',
      whatsappOptIn: true,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_manager_1',
      fullName: 'Faith Mwangi (Credit Manager)',
      email: 'manager@compinance.co.ke',
      phone: '+254700000004',
      passwordHash: defaultPasswordHash,
      type: 'staff',
      role: 'manager',
      whatsappOptIn: true,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_care_1',
      fullName: 'Brian Omondi (Customer Care)',
      email: 'care@compinance.co.ke',
      phone: '+254700000005',
      passwordHash: defaultPasswordHash,
      type: 'staff',
      role: 'customer_care',
      whatsappOptIn: false,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_student_demo',
      fullName: 'Grace Wanjiku',
      email: 'student@uonbi.ac.ke',
      phone: '+254712345678',
      passwordHash: defaultPasswordHash,
      type: 'student',
      whatsappOptIn: true,
      status: 'approved',
      loanLimit: 30, // First time default is always KES 30
      isDefaulter: false,
      totalLoansCompleted: 0,
      parentPhone: '+254722998877',
      parentOtpVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const user of seedUsers) {
    await (await usersRef.doc(user.id)).set(user);
  }

  logger.info('Compinance default staff hierarchy and demo student accounts seeded successfully');
}
