import HeroSection from "@/components/homepage/hero-section";
import SideBySide from "@/components/homepage/side-by-side";
import PageWrapper from "@/components/wrapper/page-wrapper";
import MarketingCards from "@/components/homepage/marketing-cards";
import BlogSample from "@/components/homepage/blog-samples";
import config from "@/config";
import Pricing from "@/components/homepage/pricing";
import AccordionComponent from "@/components/homepage/accordion-component";
export default function Home() {
  return (
    <PageWrapper>
      <div className="flex flex-col justify-center items-center w-full mt-[1rem] p-3">
        <HeroSection />
      </div>
      <SideBySide />
      <MarketingCards />
      <BlogSample />
      {config.auth.enabled && config.payments.enabled && (
        <div>
          <Pricing />
        </div>
      )}
      <AccordionComponent />
    </PageWrapper>
  );
}
