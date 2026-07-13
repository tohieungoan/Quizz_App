import React from 'react'
import { Lightbulb, Users, BarChart3, ArrowRight } from 'lucide-react'

export const AboutUs: React.FC = () => {
  return (
    <div className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 flex flex-col gap-24">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
          Empowering Education <br />
          <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-surface-tint">
            Through Play
          </span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          We believe learning shouldn't be a chore. QuizzApp merges high-stakes academic rigor with the dopamine rush of modern gaming, creating an ecosystem where progress is celebrated and anxiety is left behind.
        </p>
      </section>

      {/* Our Story (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-5 bg-surface rounded-xl shadow-level-1 p-8 flex flex-col justify-center border-t-4 border-primary">
          <span className="font-label-bold text-label-bold text-primary uppercase tracking-wider mb-2">Our Story</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Bridging the Gap</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            It started in a dorm room. We saw students paralyzed by test anxiety, rote memorization, and a lack of real-time feedback. Formal exams were dry; gamification was often superficial. We set out to build a bridge: a platform that respects the curriculum but speaks the language of modern, engaging mobile design.
          </p>
        </div>
        <div className="md:col-span-7 rounded-xl overflow-hidden relative shadow-level-1 min-h-[300px] md:min-h-[400px]">
          <img
            className="absolute inset-0 w-full h-full object-cover"
            alt="A modern, brightly lit classroom setting with students engaged with tablets."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQoX3_03z8LCQuXuTxRp89Rh5T_VH5jZ5DV-3uVqxvW8iBaNSDqJqAYl4snuuff1Nc8u82i3KRRDHC6Ydfq2yGwuQ5zcqJH5QJMkRFinrZR2UtPLHwji1QG2WsKKmi-3_bdrRPbsz7bPnY56C4AphMW3hs81FbseFAlmbvQBX16gzZeN4VqGC78WGwTwY6v67f9JW3Phn6Ff-AW-SrRJd1lQkRch2b_RiOPWMPb3tVROEEY8lwkKGjjpGyN_pptPCh_PARgUcKZEg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 to-transparent flex items-end p-8">
            <p className="font-body-lg text-body-lg text-on-primary font-medium">Transforming assessment into an inviting, low-friction experience.</p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="bg-surface rounded-xl shadow-level-1 p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <Lightbulb className="w-8 h-8 mx-auto text-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Innovation</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pushing the boundaries of how knowledge is acquired and tested. We constantly iterate on our design to keep learning fresh and rewarding.
            </p>
          </div>
          {/* Value 2 */}
          <div className="bg-surface rounded-xl shadow-level-1 p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mb-6 text-on-secondary-container group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 mx-auto text-secondary" />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Inclusivity</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Designing for every learner. Our interface is clear, accessible, and designed to reduce cognitive load, ensuring everyone has a fair shot.
            </p>
          </div>
          {/* Value 3 */}
          <div className="bg-surface rounded-xl shadow-level-1 p-8 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-6 text-on-primary-container group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 mx-auto text-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">Impact</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Measurable success. We focus on real academic achievement driven by intrinsic motivation and clear, immediate feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Visual / Call to Action */}
      <section className="bg-surface-variant rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary rounded-full opacity-10 blur-[80px]"></div>
        <div className="md:w-1/2 space-y-6 z-10">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Join the Evolution of Learning</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Whether you're an educator looking to energize your classroom or a student ready to conquer exams, QuizzApp is built for you. Let's make learning an achievement, not a task.
          </p>
          <button className="font-button text-button bg-primary text-on-primary px-8 py-4 rounded-full hover:shadow-level-2 transition-shadow duration-300 flex items-center gap-2 mt-4">
            Start Playing Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="md:w-1/2 w-full aspect-square md:aspect-video rounded-xl overflow-hidden shadow-level-1 relative z-10 border-4 border-surface">
          <img
            className="w-full h-full object-cover"
            alt="A stylized 3D rendered graphic showing abstract glowing geometric shapes representing data and progress."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeHgDK8IquggUK9Y77DsFk3wnRxMq_g3B5KUw1qK2tWpgeOqKOrV-NgG_q8QX5onY-QVFpYwi5gprPoA-qrblalhd_pVipshNCl6Zp89Tl5185zE4JWVE10JQ68dMkVHY0MVtyeZHS18sp70qCuxDCDZyzMHBdcEcXNrd2bLODMiiy94ssp6D1BiB1HYbkoqZVlOHu3XiY78wuXAtEDLK6sXekQBEuSC5SKFpYDmB6PCaHo33pRTvHlzhXb8-EsJjjZQmgjKUnTR0"
          />
        </div>
      </section>
    </div>
  )
}
