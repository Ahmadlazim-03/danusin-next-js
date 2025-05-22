import { Tag } from "lucide-react";
import { CategoryCard } from "@/components/category-card";

type Category = {
  name: string;
  icon: React.ReactNode;
  color: string;
};

type CategoriesProps = {
  categories: Category[];
};

export function Categories({ categories }: CategoriesProps) {
  return (
    <section className="mb-6 md:mb-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center">
          <Tag className="mr-2 h-5 w-5 text-emerald-400" />
          Browse by Category
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
        {categories.map((category, index) => (
          <CategoryCard key={index} category={category} />
        ))}
      </div>
    </section>
  );
}