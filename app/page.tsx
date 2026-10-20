import Navbar from "@/components/Navbar";
import SequenceScroll from "@/components/SequenceScroll";
import ProductDetails from "@/components/ProductDetails";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <SequenceScroll />
        <ProductDetails />
      </main>
      <Footer />
    </>
  );
}
