import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="min-w-[44px] min-h-[44px]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      {isOpen && (
        <div className="fixed inset-0 bg-zinc-900/95 z-50 flex flex-col p-4 overflow-y-auto">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="min-w-[44px] min-h-[44px]"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex flex-col gap-4 mt-4">
            {["Store", "Library", "Community", "News", "Support"].map(
              (item) => (
                <Link
                  key={item}
                  href={`/dashboard/${item.toLowerCase()}`}
                  className="text-white hover:text-emerald-400 text-lg py-2 px-4"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              )
            )}
            <Accordion type="single" collapsible>
              <AccordionItem value="categories">
                <AccordionTrigger className="text-emerald-400 text-lg py-2 px-4">
                  Categories
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 px-4">
                    {[
                      "Action",
                      "Adventure",
                      "RPG",
                      "Strategy",
                      "Simulation",
                    ].map((category) => (
                      <li key={category}>
                        <Link
                          href={`/dashboard/${category.toLowerCase()}`}
                          className="text-zinc-400 hover:text-white py-2 block"
                          onClick={() => setIsOpen(false)}
                        >
                          {category}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>
        </div>
      )}
    </div>
  );
}
