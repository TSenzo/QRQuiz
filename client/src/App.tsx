import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CreateQuiz from "@/pages/create-quiz";
import ScanQR from "@/pages/scan-qr";
import TakeQuiz from "@/pages/take-quiz";
import QuizResults from "@/pages/quiz-results";
import QRCode from "@/pages/qr-code";
import Leaderboard from "@/pages/leaderboard";
import Multiplayer from "@/pages/multiplayer";
import MultiplayerLobby from "@/pages/multiplayer-lobby";
import MultiplayerGame from "@/pages/multiplayer-game";
import MultiplayerResults from "@/pages/multiplayer-results";
import TabBar from "@/components/tab-bar";
import { useLocation } from "wouter";

function Router() {
  const [location] = useLocation();
  
  // Check if the current route should show the tab bar
  const showTabBar = !location.includes("/scan-qr");
  
  return (
    <div className="app-container bg-white shadow-xl">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/create-quiz" component={CreateQuiz} />
        <Route path="/scan-qr" component={ScanQR} />
        <Route path="/take-quiz/:id" component={TakeQuiz} />
        <Route path="/quiz-results/:id/:score" component={QuizResults} />
        <Route path="/qr-code/:id" component={QRCode} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/multiplayer" component={Multiplayer} />
        <Route path="/multiplayer-lobby/:id" component={MultiplayerLobby} />
        <Route path="/multiplayer-game/:id" component={MultiplayerGame} />
        <Route path="/multiplayer-results/:id" component={MultiplayerResults} />
        <Route component={NotFound} />
      </Switch>
      
      {showTabBar && <TabBar />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
