"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  or,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function SupplierUsersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          or(where("role", "==", "supplier"), where("role", "==", "Supplier"))
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(users);
      } catch (error) {
        toast.error("Failed to fetch suppliers.");
        console.error("Error fetching suppliers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleDelete = async (id) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          await deleteDoc(doc(db, "users", id));
          setSuppliers((prev) => prev.filter((user) => user.id !== id));
          resolve("Supplier deleted successfully.");
        } catch (err) {
          console.error("Error deleting supplier:", err);
          reject("Failed to delete supplier.");
        }
      }),
      {
        loading: "Deleting supplier...",
        success: (msg) => msg,
        error: (err) => err,
      }
    );
  };

  const handleEdit = (id) => {
    router.push(`/admin-dashboard/users/edit/${id}`);
  };

  const handleApprove = async (id) => {
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Step 1: Approve in Firestore
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/approve-supplier/${id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
            }
          );

          // Step 2: Authenticate in Firebase Auth
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/authenticate-supplier/${id}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );

          setSuppliers((prev) =>
            prev.map((user) =>
              user.id === id ? { ...user, isApproved: true } : user
            )
          );
          resolve("Supplier approved and authenticated.");
        } catch (err) {
          console.error("Error during approval/authentication:", err);
          reject("Failed to approve/authenticate supplier.");
        }
      }),
      {
        loading: "Approving and authenticating supplier...",
        success: (msg) => msg,
        error: (err) => err,
      }
    );
  };

  return (
    <div className='px-6 py-8 max-w-6xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Supplier Users</h1>
        <Link href='/admin-dashboard/users/suppliers/add'>
          <button className='bg-green-700 text-white px-4 py-2 rounded'>
            + Add Supplier
          </button>
        </Link>
      </div>

      {loading ? (
        <p className='text-gray-500'>Loading...</p>
      ) : suppliers.length === 0 ? (
        <p className='text-gray-500'>No supplier users found.</p>
      ) : (
        <table className='w-full border text-sm'>
          <thead className='bg-gray-100 text-left'>
            <tr>
              <th className='p-3 border-b'>Name</th>
              <th className='p-3 border-b'>Email</th>
              <th className='p-3 border-b'>Phone</th>
              <th className='p-3 border-b'>Approval</th>
              <th className='p-3 border-b'>Created At</th>
              <th className='p-3 border-b'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className='hover:bg-gray-50'>
                <td className='p-3 border-b'>
                  {supplier.name || supplier.representativeName || "N/A"}
                </td>
                <td className='p-3 border-b'>
                  {supplier.email || supplier.representativeEmail || "N/A"}
                </td>
                <td className='p-3 border-b'>
                  {supplier.phone || supplier.representativePhone || "N/A"}
                </td>
                <td className='p-3 border-b'>
                  {supplier.isApproved === false ? (
                    <span className='px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full'>
                      Pending
                    </span>
                  ) : (
                    <span className='px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full'>
                      Approved
                    </span>
                  )}
                </td>
                <td className='p-3 border-b'>
                  {supplier.createdAt?.seconds
                    ? new Date(
                        supplier.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : supplier.createdAt
                    ? new Date(supplier.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className='p-3 border-b space-x-2'>
                  <button
                    onClick={() => handleEdit(supplier.id)}
                    className='text-blue-600 hover:underline text-sm'
                  >
                    Edit
                  </button>

                  {supplier.isApproved === false && (
                    <button
                      onClick={() => handleApprove(supplier.id)}
                      className='text-green-600 hover:underline text-sm'
                    >
                      Approve
                    </button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        onClick={() => setSelectedSupplier(supplier)}
                        className='text-red-600 hover:underline text-sm'
                      >
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this supplier.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(supplier.id)}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
