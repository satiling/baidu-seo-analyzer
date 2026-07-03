import HeroScanner from "@/components/home/HeroScanner";
import CapabilityGrid from "@/components/home/CapabilityGrid";
import AlgorithmMatrix from "@/components/home/AlgorithmMatrix";
import ProcessFlow from "@/components/home/ProcessFlow";
import StatsBand from "@/components/home/StatsBand";
import AiDetectEntry from "@/components/home/AiDetectEntry";

export default function Home() {
  return (
    <>
      <HeroScanner />
      <StatsBand />
      <AiDetectEntry />
      <CapabilityGrid />
      <AlgorithmMatrix />
      <ProcessFlow />
    </>
  );
}
