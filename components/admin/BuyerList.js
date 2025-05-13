import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

const BuyerList = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        // Query Firestore to get buyers with role 'buyer'
        const buyersQuery = query(
          collection(db, "users"),
          where("role", "==", "buyer") // Filter for buyers only
        );
        const querySnapshot = await getDocs(buyersQuery);
        const buyerData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          phone: doc.data().phone,
          email: doc.data().email,
          companyName: doc.data().companyName,
        }));
        setBuyers(buyerData);
      } catch (error) {
        console.error("Error fetching buyers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  const handleRemove = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id)); // Delete the document by ID
      setBuyers((prevBuyers) => prevBuyers.filter((buyer) => buyer.id !== id)); // Update state to reflect changes
    } catch (error) {
      console.error("Error removing buyer:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className='container mt-4'>
      <h4 className='text-success fw-bold mb-4'>Buyers</h4>
      <table className='table table-striped table-bordered'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Company Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((buyer) => (
            <tr key={buyer.id}>
              <td>{buyer.name}</td>
              <td>{buyer.phone}</td>
              <td>{buyer.email}</td>
              <td>{buyer.companyName}</td>
              <td>
                <button
                  className='btn btn-primary btn-sm me-2'
                  onClick={() =>
                    alert(
                      `Edit functionality not implemented for ${buyer.name}`
                    )
                  }
                >
                  Edit
                </button>
                <button
                  className='btn btn-danger btn-sm'
                  onClick={() => handleRemove(buyer.id)} // Call the remove function
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className='d-flex justify-content-between align-items-center'>
        <button className='btn btn-secondary btn-sm' disabled>
          Previous
        </button>
        <p className='mb-0'>Page 1 of 1</p>
        <button className='btn btn-secondary btn-sm' disabled>
          Next
        </button>
      </div>
    </div>
  );
};

export default BuyerList;
