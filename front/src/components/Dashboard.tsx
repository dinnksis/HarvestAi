import { useState } from "react";
import {
  Leaf,
  MapPin,
  TrendingUp,
  FileText,
  LogOut,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Button } from "./ui/button";
import FieldsList from "./FieldsList";
import MapView from "./MapView";
import Recommendations from "./Recommendations";
import Reports from "./Reports";
import AddFieldDialog from "./AddFieldDialog";
import FieldBoundaryMap from "./FieldBoundaryMap";
import { toast } from "sonner";

interface DashboardProps {
  onLogout: () => void;
}

// УБРАЛИ "fertilizer-map" - теперь всё в одной вкладке "map"
type View = "fields" | "map" | "recommendations" | "reports" | "draw-boundary";

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  lastUpdate: string;
  ndvi: number;
  status: "healthy" | "warning" | "attention";
  hasRecommendations: boolean;
  boundary?: [number, number][];
}

const initialFields: Field[] = [
  {
    id: "1",
    name: "Поле №1",
    area: 12,
    cropType: "Пшеница",
    lastUpdate: "2024-12-10",
    ndvi: 0.72,
    status: "healthy",
    hasRecommendations: true,
    boundary: [
      [55.7558, 37.6173],
      [55.7568, 37.6183],
      [55.7578, 37.6173],
      [55.7568, 37.6163],
    ],
  },
  {
    id: "2",
    name: "Поле №2",
    area: 25,
    cropType: "Кукуруза",
    lastUpdate: "2024-12-09",
    ndvi: 0.65,
    status: "warning",
    hasRecommendations: false,
    boundary: [
      [55.7508, 37.6203],
      [55.7518, 37.6223],
      [55.7528, 37.6203],
      [55.7518, 37.6183],
    ],
  },
  {
    id: "3",
    name: "Поле №3",
    area: 18,
    cropType: "Соя",
    lastUpdate: "2024-12-08",
    ndvi: 0.58,
    status: "attention",
    hasRecommendations: true,
    boundary: [
      [55.7608, 37.6103],
      [55.7618, 37.6123],
      [55.7628, 37.6103],
      [55.7618, 37.6083],
    ],
  },
];

export default function Dashboard({ onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>("fields");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [showAddField, setShowAddField] = useState(false);
  const [drawingField, setDrawingField] = useState<{
    name: string;
    cropType: string;
  } | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleAddField = (fieldData: {
    name: string;
    cropType: string;
    skipSave?: boolean;
  }) => {
    if (fieldData.skipSave) {
      return;
    }
    
    const newField: Field = {
      id: String(fields.length + 1),
      name: fieldData.name,
      area: 0,
      cropType: fieldData.cropType,
      lastUpdate: new Date().toISOString().split("T")[0],
      ndvi: 0,
      status: "healthy",
      hasRecommendations: false,
    };
    setFields([...fields, newField]);
    setShowAddField(false);
    
    toast.success(`Поле "${fieldData.name}" добавлено (без границ)`);
  };

  const handleStartDrawing = (fieldData: {
    name: string;
    cropType: string;
  }) => {
    setDrawingField(fieldData);
    setShowAddField(false); // Закрываем диалог
    setCurrentView("draw-boundary");
    toast.info(`Теперь отметьте границы поля "${fieldData.name}" на карте`);
  };

  const handleBoundaryComplete = (
    boundary: [number, number][],
    calculatedArea: number
  ) => {
    if (!drawingField) return;

    const newField: Field = {
      id: String(fields.length + 1),
      name: drawingField.name,
      area: calculatedArea > 0 ? calculatedArea : 0,
      cropType: drawingField.cropType,
      lastUpdate: new Date().toISOString().split("T")[0],
      ndvi: 0,
      status: "healthy",
      hasRecommendations: false,
      boundary: boundary,
    };

    setFields([...fields, newField]);
    setDrawingField(null);
    setCurrentView("fields");

    toast.success(
      `Поле "${drawingField.name}" создано! Площадь: ${newField.area.toFixed(2)} га`
    );
  };

  const handleFieldSelect = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setCurrentView("map");
  };

  const handleRequestData = (fieldId: string) => {
    const updatedFields = fields.map((f) =>
      f.id === fieldId
        ? {
            ...f,
            lastUpdate: new Date().toISOString().split("T")[0],
          }
        : f
    );
    setFields(updatedFields);
    
    toast.success("Данные обновлены");
  };

  return (
    <div className="h-screen flex bg-[#131613]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0e0c] border-r border-[#2b8d35]/20 flex flex-col">
        <div className="p-6 border-b border-[#2b8d35]/20">
          <div className="flex items-center gap-2">
            <div className="bg-[#66d771] p-2 rounded-lg">
              <Leaf className="size-6 text-[#0c0e0c]" />
            </div>
            <span className="text-white text-xl text-left">HarvestAI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={currentView === "fields" ? "secondary" : "ghost"}
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
          
          {/* ОДНА кнопка "Карта поля" - теперь включает и NDVI и удобрения */}
          <Button
            variant={currentView === "map" ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              currentView === "map"
                ? "bg-[#2b8d35]/20 text-[#66d771]"
                : "text-[#b2b3b2] hover:text-[#66d771]"
            }`}
            onClick={() => setCurrentView("map")}
            disabled={!selectedFieldId}
          >
            <Leaf className="size-5 mr-2" />
            Карта поля
          </Button>
          
          <Button
            variant={currentView === "recommendations" ? "secondary" : "ghost"}
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
            variant={currentView === "reports" ? "secondary" : "ghost"}
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

        <div className="p-4 border-t border-[#2b8d35]/20">
          <div className="mb-4 p-3 bg-[#2b8d35]/10 rounded-lg">
            <p className="text-white text-sm">Иван Петров</p>
            <p className="text-[#b2b3b2] text-xs">ivan@example.com</p>
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
      <main className="flex-1 overflow-hidden">
        {/* View: Мои поля */}
        {currentView === "fields" && (
          <div className="h-full overflow-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-white text-3xl mb-2">Мои поля</h1>
                  <p className="text-[#b2b3b2]">
                    Управляйте своими полями и отслеживайте их состояние
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
          </div>
        )}

        {/* View: Карта поля (теперь включает и NDVI и удобрения) */}
        {currentView === "map" && selectedField && (
          <div className="h-full">
            <MapView field={selectedField} />
          </div>
        )}

        {/* View: Рекомендации */}
        {currentView === "recommendations" && selectedField && (
          <div className="h-full overflow-auto">
            <Recommendations field={selectedField} />
          </div>
        )}

        {/* View: Отчёты */}
        {currentView === "reports" && (
          <div className="h-full overflow-auto">
            <Reports fields={fields} />
          </div>
        )}

        {/* View: Рисование границ */}
        {currentView === "draw-boundary" && drawingField && (
          <div className="h-full flex flex-col">
            {/* Компактный заголовок */}
            <div className="flex-shrink-0 bg-[#0c0e0c] border-b border-[#2b8d35]/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      setDrawingField(null);
                      setCurrentView("fields");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-[#b2b3b2] hover:text-white"
                  >
                    <ArrowLeft className="size-4 mr-1" />
                    Назад к полям
                  </Button>
                  <div>
                    <h2 className="text-white text-xl">
                      Рисование границ:{" "}
                      <span className="text-[#66d771]">{drawingField.name}</span>
                    </h2>
                    <p className="text-sm text-[#b2b3b2]">
                      Кликайте на карте чтобы добавить точки. Минимум 3 точки.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#b2b3b2]">
                    Культура: {drawingField.cropType}
                  </span>
                  <Button
                    onClick={() => {
                      setDrawingField(null);
                      setCurrentView("fields");
                    }}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500"
                  >
                    Отменить
                  </Button>
                </div>
              </div>
            </div>

            {/* Карта занимает всё оставшееся пространство */}
            <div className="flex-1">
              <FieldBoundaryMap
                key={`field-boundary-${drawingField.name}-${Date.now()}`}
                fieldName={drawingField.name}
                onBoundaryComplete={handleBoundaryComplete}
                onCancel={() => {
                  setDrawingField(null);
                  setCurrentView("fields");
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={showAddField}
        onOpenChange={setShowAddField}
        onAddField={handleAddField}
        onDrawBoundary={handleStartDrawing}
      />
    </div>
  );
}