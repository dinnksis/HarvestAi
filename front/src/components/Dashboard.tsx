import { useState } from "react";
import {
  Leaf,
  MapPin,
  TrendingUp,
  FileText,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import FieldsList from "./FieldsList";
import MapView from "./MapView";
import Recommendations from "./Recommendations";
import Reports from "./Reports";
import AddFieldDialog from "./AddFieldDialog";

interface DashboardProps {
  onLogout: () => void;
}

type View = "fields" | "map" | "recommendations" | "reports";

// Mock field data
const initialFields = [
  {
    id: "1",
    name: "Поле №1",
    area: 12,
    cropType: "Пшеница",
    lastUpdate: "2024-12-10",
    ndvi: 0.72,
    status: "healthy" as const,
    hasRecommendations: true,
  },
  {
    id: "2",
    name: "Поле №2",
    area: 25,
    cropType: "Кукуруза",
    lastUpdate: "2024-12-09",
    ndvi: 0.65,
    status: "warning" as const,
    hasRecommendations: false,
  },
  {
    id: "3",
    name: "Поле №3",
    area: 18,
    cropType: "Соя",
    lastUpdate: "2024-12-08",
    ndvi: 0.58,
    status: "attention" as const,
    hasRecommendations: true,
  },
];

export default function Dashboard({
  onLogout,
}: DashboardProps) {
  const [currentView, setCurrentView] =
    useState<View>("fields");
  const [selectedFieldId, setSelectedFieldId] = useState<
    string | null
  >(null);
  const [fields, setFields] = useState(initialFields);
  const [showAddField, setShowAddField] = useState(false);

  const selectedField = fields.find(
    (f) => f.id === selectedFieldId,
  );

  const handleAddField = (fieldData: any) => {
    const newField = {
      id: String(fields.length + 1),
      name: fieldData.name,
      area: fieldData.area,
      cropType: fieldData.cropType,
      lastUpdate: new Date().toISOString().split("T")[0],
      ndvi: 0,
      status: "healthy" as const,
      hasRecommendations: false,
    };
    setFields([...fields, newField]);
    setShowAddField(false);
  };

  const handleFieldSelect = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setCurrentView("map");
  };

  const handleRequestData = (fieldId: string) => {
    // Mock data request
    const updatedFields = fields.map((f) =>
      f.id === fieldId
        ? {
            ...f,
            lastUpdate: new Date().toISOString().split("T")[0],
          }
        : f,
    );
    setFields(updatedFields);
  };

  return (
    <div className="h-screen flex bg-[#131613]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0e0c] border-r border-[#2b8d35]/20 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2b8d35]/20">
          <div className="flex items-center gap-2">
            <div className="bg-[#66d771] p-2 rounded-lg">
              <Leaf className="size-6 text-[#0c0e0c]" />
            </div>
            <span className="text-white text-xl text-left">
              HarvestAI
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={
              currentView === "fields" ? "secondary" : "ghost"
            }
            className={`w-full justify-start ${
              currentView === "fields"
                ? "bg-[#2b8d35]/20 text-[#66d771]"
                : "text-[#b2b3b2] hover:text-[#66d771]"
            }`}
            onClick={() => setCurrentView("fields")}
          >
            <MapPin className="size-5 mr-2" />
            Мои поля
          </Button>
          <Button
            variant={
              currentView === "map" ? "secondary" : "ghost"
            }
            className={`w-full justify-start ${
              currentView === "map"
                ? "bg-[#2b8d35]/20 text-[#66d771]"
                : "text-[#b2b3b2] hover:text-[#66d771]"
            }`}
            onClick={() => setCurrentView("map")}
            disabled={!selectedFieldId}
          >
            <Leaf className="size-5 mr-2" />
            Карта полей
          </Button>
          <Button
            variant={
              currentView === "recommendations"
                ? "secondary"
                : "ghost"
            }
            className={`w-full justify-start ${
              currentView === "recommendations"
                ? "bg-[#2b8d35]/20 text-[#66d771]"
                : "text-[#b2b3b2] hover:text-[#66d771]"
            }`}
            onClick={() => setCurrentView("recommendations")}
            disabled={!selectedFieldId}
          >
            <TrendingUp className="size-5 mr-2" />
            Рекомендации
          </Button>
          <Button
            variant={
              currentView === "reports" ? "secondary" : "ghost"
            }
            className={`w-full justify-start ${
              currentView === "reports"
                ? "bg-[#2b8d35]/20 text-[#66d771]"
                : "text-[#b2b3b2] hover:text-[#66d771]"
            }`}
            onClick={() => setCurrentView("reports")}
          >
            <FileText className="size-5 mr-2" />
            Отчёты
          </Button>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-[#2b8d35]/20">
          <div className="mb-4 p-3 bg-[#2b8d35]/10 rounded-lg">
            <p className="text-white text-sm">Иван Петров</p>
            <p className="text-[#b2b3b2] text-xs">
              ivan@example.com
            </p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-[#b2b3b2] hover:text-[#66d771]"
            onClick={onLogout}
          >
            <LogOut className="size-5 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "fields" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-white text-3xl mb-2">
                  Мои поля
                </h1>
                <p className="text-[#b2b3b2]">
                  Управляйте своими полями и отслеживайте их
                  состояние
                </p>
              </div>
              <Button
                onClick={() => setShowAddField(true)}
                className="bg-[#2b8d35] hover:bg-[#66d771] text-[#0c0e0c]"
              >
                <Plus className="size-5 mr-2" />
                Добавить поле
              </Button>
            </div>
            <FieldsList
              fields={fields}
              onFieldSelect={handleFieldSelect}
              onRequestData={handleRequestData}
            />
          </div>
        )}

        {currentView === "map" && selectedField && (
          <MapView field={selectedField} />
        )}

        {currentView === "recommendations" && selectedField && (
          <Recommendations field={selectedField} />
        )}

        {currentView === "reports" && (
          <Reports fields={fields} />
        )}
      </main>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={showAddField}
        onOpenChange={setShowAddField}
        onAddField={handleAddField}
      />
    </div>
  );
}