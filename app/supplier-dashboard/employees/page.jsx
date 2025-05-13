"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CreatableSelect from "react-select/creatable";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const roleOptions = [
  { value: "Supplier Admin", label: "Supplier Admin" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Order Manager", label: "Order Manager" },
  {
    value: "Customer Service Representative",
    label: "Customer Service Representative",
  },
  { value: "Inventory Coordinator", label: "Inventory Coordinator" },
];

const ManageEmployees = ({ supplierId: passedSupplierId }) => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    email: "",
    username: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(null);
  const [supplierId, setSupplierId] = useState(passedSupplierId || null);
  const auth = getAuth();

  const fetchEmployees = useCallback(async () => {
    if (!supplierId) {
      console.error(t("employees.missing_supplier_id"));
      return;
    }

    try {
      const q = query(
        collection(db, "employees"),
        where("supplierId", "==", supplierId)
      );
      const data = await getDocs(q);
      setEmployees(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error(t("employees.fetch_employees_error"), error);
    }
  }, [supplierId, t]);

  useEffect(() => {
    if (!passedSupplierId) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setSupplierId(user.uid);
        else console.error(t("employees.user_not_authenticated"));
      });
      return () => unsubscribe();
    }
  }, [auth, passedSupplierId, t]);

  useEffect(() => {
    if (supplierId) fetchEmployees();
  }, [supplierId, fetchEmployees]);

  const addEmployee = async () => {
    if (!supplierId) {
      console.error(t("employees.missing_supplier_id"));
      return;
    }

    const { name, role, email, username, password } = newEmployee;
    if (!name || !role || !email || !username || !password) {
      console.error(t("employees.all_fields_required"));
      return;
    }

    try {
      await addDoc(collection(db, "employees"), { ...newEmployee, supplierId });
      console.log(t("employees.added"));
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error(t("employees.add_employee_error"), error);
    }
  };

  const updateEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await updateDoc(employeeDoc, newEmployee);
      console.log(t("employees.updated"));
      fetchEmployees();
      resetForm();
      setEditMode(null);
    } catch (error) {
      console.error(t("employees.update_employee_error"), error);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await deleteDoc(employeeDoc);
      console.log(t("employees.deleted"));
      fetchEmployees();
    } catch (error) {
      console.error(t("employees.delete_employee_error"), error);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: "",
      role: "",
      email: "",
      username: "",
      password: "",
    });
  };

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'>
      <Card className='p-4 sm:p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-2'>{t("employees.manage")}</h2>
        <p className='text-sm text-muted-foreground mb-4'>
          {t("employees.description")}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium'>{t("employees.name")}</label>
            <Input
              value={newEmployee.name}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, name: e.target.value })
              }
              placeholder={t("employees.enter_name")}
              className='mb-3'
            />

            <label className='text-sm font-medium'>{t("employees.role")}</label>
            <CreatableSelect
              options={roleOptions}
              placeholder={t("employees.select_or_create_role")}
              value={
                newEmployee.role
                  ? { value: newEmployee.role, label: newEmployee.role }
                  : null
              }
              onChange={(selectedOption) =>
                setNewEmployee({
                  ...newEmployee,
                  role: selectedOption ? selectedOption.value : "",
                })
              }
              classNamePrefix='react-select'
              className='mb-3'
            />
          </div>

          <div>
            <label className='text-sm font-medium'>
              {t("employees.email")}
            </label>
            <Input
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, email: e.target.value })
              }
              placeholder={t("employees.enter_email")}
              className='mb-3'
            />

            <label className='text-sm font-medium'>
              {t("employees.username")}
            </label>
            <Input
              value={newEmployee.username}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, username: e.target.value })
              }
              placeholder={t("employees.enter_username")}
              className='mb-3'
            />

            <label className='text-sm font-medium'>
              {t("employees.password")}
            </label>
            <Input
              type='password'
              value={newEmployee.password}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, password: e.target.value })
              }
              placeholder={t("employees.enter_password")}
              className='mb-3'
            />
          </div>
        </div>

        <Button
          onClick={editMode ? () => updateEmployee(editMode) : addEmployee}
          className='mt-4'
        >
          {editMode ? t("employees.update") : t("employees.add")}
        </Button>
      </Card>

      <Card className='p-4 sm:p-6'>
        <h3 className='text-lg font-semibold mb-4'>{t("employees.current")}</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employees.name")}</TableHead>
              <TableHead>{t("employees.role")}</TableHead>
              <TableHead>{t("employees.email")}</TableHead>
              <TableHead>{t("employees.username")}</TableHead>
              <TableHead>{t("employees.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.username}</TableCell>
                <TableCell>
                  <Button
                    variant='outline'
                    size='sm'
                    className='mr-2'
                    onClick={() => {
                      setEditMode(employee.id);
                      setNewEmployee(employee);
                    }}
                  >
                    {t("employees.edit")}
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => deleteEmployee(employee.id)}
                  >
                    {t("employees.delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageEmployees;
