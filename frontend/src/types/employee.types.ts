export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  emailVerified: string | null;
  serviceTypeId: string | null;
  serviceType: { id: string; name: string } | null;
  createdAt: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'STAFF';
  serviceTypeId: string;
}

export interface UpdateEmployeeData {
  name?: string;
  role?: 'EMPLOYEE' | 'STAFF';
  status?: 'ACTIVE' | 'INACTIVE';
}
