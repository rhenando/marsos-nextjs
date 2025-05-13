"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function BuyerUsersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "buyer"));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBuyers(users);
      } catch (error) {
        toast.error("Failed to fetch buyers.");
        console.error("Error fetching buyers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "users", id));
      setBuyers((prev) => prev.filter((user) => user.id !== id));
      toast.success("Buyer deleted successfully.");
    } catch (error) {
      console.error("Error deleting buyer:", error);
      toast.error("Failed to delete buyer.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id) => {
    router.push(`/admin-dashboard/users/edit/${id}`);
  };

  return (
    <div className='px-6 py-8 max-w-6xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Buyer Users</h1>

      {loading ? (
        <p className='text-gray-500'>Loading...</p>
      ) : buyers.length === 0 ? (
        <p className='text-gray-500'>No buyer users found.</p>
      ) : (
        <table className='w-full border text-sm'>
          <thead className='bg-gray-100 text-left'>
            <tr>
              <th className='p-3 border-b'>Name</th>
              <th className='p-3 border-b'>Email</th>
              <th className='p-3 border-b'>Phone</th>
              <th className='p-3 border-b'>Created At</th>
              <th className='p-3 border-b'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((buyer) => (
              <tr key={buyer.id} className='hover:bg-gray-50'>
                <td className='p-3 border-b'>{buyer.name || "N/A"}</td>
                <td className='p-3 border-b'>{buyer.email || "N/A"}</td>
                <td className='p-3 border-b'>
                  {buyer.phone || buyer.contact || "N/A"}
                </td>
                <td className='p-3 border-b'>
                  {buyer.createdAt
                    ? new Date(
                        buyer.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className='p-3 border-b space-x-2'>
                  <button
                    onClick={() => handleEdit(buyer.id)}
                    className='text-blue-600 hover:underline text-sm'
                  >
                    Edit
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className='text-red-600 hover:underline text-sm'>
                        Delete
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure you want to delete this buyer?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(buyer.id)}
                          disabled={deletingId === buyer.id}
                        >
                          {deletingId === buyer.id
                            ? "Deleting..."
                            : "Yes, delete"}
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
