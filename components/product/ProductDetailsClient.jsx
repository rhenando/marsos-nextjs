"use client";

import ProductDetails from "./ProductDetails"; // the actual UI component

const ProductDetailsClient = ({ product }) => {
  if (!product) return <p>No product data.</p>;

  return <ProductDetails product={product} />;
};

export default ProductDetailsClient;
