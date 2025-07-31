import Link from 'next/link'
import { MapPin, Clock, DollarSign, Heart, Laptop, Coffee, Users, Award, Brain } from 'lucide-react'

export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      salary: "$160k - $220k",
      description: "Build the next generation of business intelligence tools using React, Node.js, and AI/ML technologies."
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote", 
      type: "Full-time",
      salary: "$180k - $250k",
      description: "Develop cutting-edge AI models for business system discovery and intelligent automation."
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "New York, NY / Remote",
      type: "Full-time", 
      salary: "$140k - $180k",
      description: "Drive product strategy and roadmap for our enterprise integration platform."
    },
    {
      title: "Enterprise Sales Manager",
      department: "Sales",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $160k + Commission",
      description: "Scale our enterprise sales motion and build relationships with Fortune 500 companies."
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      salary: "$90k - $120k",
      description: "Ensure customer success and drive expansion revenue through strategic account management."
    },
    {
      title: "Data Engineer",
      department: "Engineering",
      location: "London, UK / Remote",
      type: "Full-time",
      salary: "£80k - £120k",
      description: "Build robust data pipelines and integration infrastructure for enterprise customers."
    }
  ]

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Top-tier salary, equity, and performance bonuses"
    },
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Premium health, dental, vision insurance + $2k wellness budget"
    },
    {
      icon: Laptop,
      title: "Remote-First",
      description: "Work from anywhere with flexible hours and home office stipend"
    },
    {
      icon: Coffee,
      title: "Learning & Development",
      description: "$5k annual learning budget + conference attendance"
    },
    {
      icon: Users,
      title: "Team Culture",
      description: "Annual company retreats, team offsites, and social events"
    },
    {
      icon: Award,
      title: "Growth Opportunities",
      description: "Fast career progression in a high-growth startup environment"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OPSAI</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Join the Future of
              <br />
              <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                Business Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Help us build the AI-powered platform that's transforming how businesses operate. 
              Join a team of world-class engineers, designers, and business minds.
            </p>
          </div>
        </div>
      </div>

      {/* Why OPSAI */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Work at OPSAI?</h2>
            <p className="text-xl text-gray-600">More than just a job - it's a mission to transform business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}  
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Join our growing team of innovators</p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {position.department}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {position.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {position.type}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {position.salary}
                      </div>
                    </div>
                  </div>
                  <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors mt-4 md:mt-0">
                    Apply Now
                  </button>
                </div>
                <p className="text-gray-600">{position.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Don't see the perfect role? We're always looking for exceptional talent.</p>
            <button className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Send Open Application
            </button>
          </div>
        </div>
      </div>

      {/* Company Culture */}
      <div className="py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Culture</h2>
            <p className="text-xl text-gray-300">What makes OPSAI special</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <h3 className="text-2xl font-bold mb-4">Innovation First</h3>
              <p className="text-gray-300 mb-6">We encourage experimentation and bold ideas. 20% time is built into every role for exploring new technologies and solutions.</p>
              
              <h3 className="text-2xl font-bold mb-4">Remote-Native</h3>
              <p className="text-gray-300">Built for distributed teams from day one. Async communication, flexible schedules, and results-focused culture.</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Diversity & Inclusion</h3>
              <p className="text-gray-300 mb-6">Our strength comes from diverse perspectives. We're committed to building an inclusive environment where everyone thrives.</p>
              
              <h3 className="text-2xl font-bold mb-4">Customer Impact</h3>
              <p className="text-gray-300">Every team member has direct customer contact. See how your work transforms real businesses every day.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 