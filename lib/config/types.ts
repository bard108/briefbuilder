export interface Step {
  id: string;
  title: string;
  icon: React.ComponentType;
  validation?: string[];
  isOptional?: boolean;
}