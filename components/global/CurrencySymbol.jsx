import Image from "next/image";
import sarSymbol from "../../public/sar_symbol.svg";

const Currency = ({ amount, className = "", iconClass = "" }) => {
  const numericAmount =
    typeof amount === "number" ? amount : parseFloat(amount || 0);

  const isValid = !isNaN(numericAmount) && isFinite(numericAmount);

  if (!isValid) {
    return (
      <span className='text-yellow-800 text-sm font-medium'>
        Pricing Negotiable - Contact Supplier
      </span>
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(numericAmount);

  return (
    <span className='inline-flex items-center gap-1'>
      <Image
        src={sarSymbol}
        alt='SAR'
        width={16}
        height={16}
        className={iconClass}
        priority
      />
      <span className={className}>{formattedAmount}</span>
    </span>
  );
};

export default Currency;
