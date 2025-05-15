import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";

export default function TabBar() {
  const [location] = useLocation();
  
  const tabs = [
    { path: '/', icon: 'ri-home-5-line', label: 'Accueil' },
    { path: '/create-quiz', icon: 'ri-add-box-line', label: 'Créer' },
    { path: '/scan-qr', icon: 'ri-qr-scan-line', label: 'Scanner' },
    { path: '/multiplayer', icon: 'ri-user-voice-line', label: 'Multijoueur' },
    { path: '/leaderboard', icon: 'ri-trophy-line', label: 'Classement' }
  ];
  
  return (
    <div className="tab-bar shadow-lg border-t border-neutral-200">
      <div className="tab-container flex items-center">
        {tabs.map((tab) => {
          const isActive = 
            (tab.path === '/' && location === '/') || 
            (tab.path !== '/' && location.startsWith(tab.path));
          
          return (
            <Link 
              key={tab.path} 
              href={tab.path}
              className={cn(
                "flex-1 py-3 flex flex-col items-center",
                isActive ? "text-primary-500" : "text-neutral-500"
              )}
            >
              <i className={`${tab.icon} text-xl`}></i>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
