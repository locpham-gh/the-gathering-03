export interface Resource {
  _id: string;
  title: string;
  description: string;
  contentType: "guide" | "e-book" | "course";
  fileUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  color?: string;
}
