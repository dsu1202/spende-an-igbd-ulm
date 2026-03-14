import KioskApp from "@/components/kiosk/KioskApp";

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-foreground/5 flex items-center justify-center">
      <div className="w-full max-h-full aspect-video bg-background overflow-hidden relative" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
        <KioskApp />
      </div>
    </div>
  );
};

export default Index;
