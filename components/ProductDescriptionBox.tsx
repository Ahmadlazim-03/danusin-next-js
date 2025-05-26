import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Ruler, Shield, Brush, Award, User } from "lucide-react"

export default function ProductDescriptionBox() {
  return (
    <div className="max-w-6xl mx-auto my-12 p-8 bg-white rounded-xl border border-gray-200 transition-all duration-300 ease-in-out">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="text-[#8B4D65] transition-colors duration-300 ease-in-out">
            <div className="text-sm mb-2 uppercase tracking-wider font-medium">Product description</div>
            <h1 className="text-4xl font-light mb-6 transition-all duration-300 ease-in-out hover:opacity-90">
              ELEGANT SIMPLICITY INSPIRED BY 1960S SCANDINAVIA
            </h1>
            <p className="text-sm leading-relaxed">
              The Contour Comfort Sofa reinterprets the quintessential elements of 1960s Scandinavian design sofas,
              blending simplicity with functionality. Named for its pronounced, clear outlines, this sofa series boasts
              a clean and sophisticated exterior, coupled with a spacious seat and plush cushioning inside. The Contour
              Comfort Series embodies elegance with a timeless appeal, highlighted by its architectural lines and subtly
              curved armrests. These features grant the design a unique visual identity across its various sizes and
              models. Perfect for contemporary settings, the Contour Comfort Sofa offers a stylish yet comfortable
              seating experience that transcends trends.
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F9] p-6 rounded-lg transition-all duration-300 ease-in-out">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="product-info" className="border-none">
              <AccordionTrigger className="text-[#8B4D65] hover:no-underline group transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 ease-in-out">
                  <Ruler className="h-4 w-4" />
                  <span className="font-semibold tracking-wide">PRODUCT INFORMATION</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-4 transition-all duration-300 ease-in-out">
                <div className="grid grid-cols-2 gap-6">
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">BASE MATERIAL:</h3>
                    <p className="font-medium">— Powder Coated Aluminum</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">UPHOLSTERY TYPE:</h3>
                    <p className="font-medium">— Hallingdal</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">HEIGHT:</h3>
                    <p className="font-medium">— 28"</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">WIDTH:</h3>
                    <p className="font-medium">— 100.4"</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">DEPTH:</h3>
                    <p className="font-medium">— 33.1"</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">SEAT HEIGHT:</h3>
                    <p className="font-medium">— 15.7"</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">SEAT DEPTH:</h3>
                    <p className="font-medium">— 24.5"</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="material" className="border-none">
              <AccordionTrigger className="text-[#8B4D65] hover:no-underline group transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 ease-in-out">
                  <Brush className="h-4 w-4" />
                  <span className="font-semibold tracking-wide">MATERIAL</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-4 transition-all duration-300 ease-in-out">
                <p className="font-medium leading-relaxed">
                  The base is powder-coated or polished aluminum made using at least 90% recycled die-casted aluminum.
                  The recycled die-casted aluminum comes from a mix of post-industrial and post-consumer waste.
                </p>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">POWDER COATED ALUMINUM:</h3>
                    <p className="font-medium">
                      — Aluminum's malleability makes it a grand fit for highly detailed, durable Muuto products,
                      bringing a light, airy feel to robust designs.
                    </p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">TEXTILE UPHOLSTERY:</h3>
                    <p className="font-medium">— 10,4 m / 11.4 yds</p>
                  </div>
                  <div className="transition-all duration-300 ease-in-out hover:bg-gray-50 p-2 rounded-md">
                    <h3 className="font-bold mb-2 text-[#8B4D65]">LEATHER UPHOLSTERY:</h3>
                    <p className="font-medium">— 21,2 m2 / 228.2 ft2</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="care" className="border-none">
              <AccordionTrigger className="text-[#8B4D65] hover:no-underline group transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 ease-in-out">
                  <Shield className="h-4 w-4" />
                  <span className="font-semibold tracking-wide">CARE INSTRUCTIONS</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="transition-all duration-300 ease-in-out">
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>Vacuum regularly using the upholstery attachment on your vacuum cleaner.</li>
                  <li>Avoid placing the sofa in direct sunlight to prevent fading.</li>
                  <li>Rotate cushions periodically to ensure even wear.</li>
                  <li>For spills, blot immediately with a clean, dry white cloth.</li>
                  <li>Professional cleaning is recommended for stubborn stains.</li>
                  <li>Use a soft brush to remove dust from the aluminum base.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="certificates" className="border-none">
              <AccordionTrigger className="text-[#8B4D65] hover:no-underline group transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 ease-in-out">
                  <Award className="h-4 w-4" />
                  <span className="font-semibold tracking-wide">CERTIFICATES & TESTS</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="transition-all duration-300 ease-in-out">
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>ANSI/BIFMA X5.4-2012 Lounge and Public Seating</li>
                  <li>California TB 117-2013 Flammability Test</li>
                  <li>REACH Compliance (Registration, Evaluation, Authorization and Restriction of Chemicals)</li>
                  <li>ISO 14001 Environmental Management System</li>
                  <li>FSC® (Forest Stewardship Council®) Certified Wood Components</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="designer" className="border-none">
              <AccordionTrigger className="text-[#8B4D65] hover:no-underline group transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-300 ease-in-out">
                  <User className="h-4 w-4" />
                  <span className="font-semibold tracking-wide">DESIGNER</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="transition-all duration-300 ease-in-out">
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Jens Risom (1916-2016)</strong> was a pioneer in modern furniture design. Born in
                    Copenhagen, Denmark, Risom studied at the School for Arts and Crafts in Copenhagen before
                    immigrating to the United States in 1939.
                  </p>
                  <p>
                    Risom's designs, characterized by their Scandinavian simplicity and functionality, played a
                    significant role in shaping the American modernist movement. His work for Knoll in the 1940s and
                    1950s, including the iconic 650 Line lounge chair, helped establish the company as a leader in
                    modern design.
                  </p>
                  <p>
                    The Contour Comfort Sofa exemplifies Risom's commitment to clean lines, comfort, and timeless
                    elegance, continuing his legacy in contemporary furniture design.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
