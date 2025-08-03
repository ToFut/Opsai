'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  ShoppingCart,
  BarChart3,
  Zap,
  CheckCircle,
  ArrowRight,
  Package,
  Target,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValueMetric {
  icon: React.ReactNode
  label: string
  value: string
  improvement: string
  color: string
}

interface InstantValuePreviewProps {
  businessType: string
  integrations: string[]
  className?: string
}

export const InstantValuePreview: React.FC<InstantValuePreviewProps> = ({
  businessType,
  integrations,
  className
}) => {
  const [visibleMetrics, setVisibleMetrics] = useState<number[]>([])

  const getMetricsForBusiness = (type: string): ValueMetric[] => {
    const baseMetrics = {
      'E-commerce': [
        {
          icon: <Clock className="w-5 h-5" />,
          label: "Time saved on reporting",
          value: "10 hours/week",
          improvement: "Automated daily reports",
          color: "text-blue-600"
        },
        {
          icon: <DollarSign className="w-5 h-5" />,
          label: "Revenue from stockout prevention",
          value: "+$12,000/month",
          improvement: "87% fewer stockouts",
          color: "text-green-600"
        },
        {
          icon: <ShoppingCart className="w-5 h-5" />,
          label: "Cart recovery rate",
          value: "+23%",
          improvement: "Automated follow-ups",
          color: "text-purple-600"
        },
        {
          icon: <Users className="w-5 h-5" />,
          label: "Customer retention",
          value: "+18%",
          improvement: "Better segmentation",
          color: "text-orange-600"
        }
      ],
      'SaaS': [
        {
          icon: <Activity className="w-5 h-5" />,
          label: "Churn reduction",
          value: "-35%",
          improvement: "Early warning system",
          color: "text-red-600"
        },
        {
          icon: <TrendingUp className="w-5 h-5" />,
          label: "MRR growth",
          value: "+22%",
          improvement: "Upsell opportunities",
          color: "text-green-600"
        },
        {
          icon: <Clock className="w-5 h-5" />,
          label: "Support ticket time",
          value: "-40%",
          improvement: "Proactive monitoring",
          color: "text-blue-600"
        },
        {
          icon: <Target className="w-5 h-5" />,
          label: "Feature adoption",
          value: "+45%",
          improvement: "Usage insights",
          color: "text-purple-600"
        }
      ],
      'Healthcare': [
        {
          icon: <Users className="w-5 h-5" />,
          label: "Patient satisfaction",
          value: "+28%",
          improvement: "Streamlined scheduling",
          color: "text-blue-600"
        },
        {
          icon: <Clock className="w-5 h-5" />,
          label: "Appointment efficiency",
          value: "+35%",
          improvement: "Reduced wait times",
          color: "text-green-600"
        },
        {
          icon: <BarChart3 className="w-5 h-5" />,
          label: "Compliance reporting",
          value: "100% automated",
          improvement: "Zero manual work",
          color: "text-purple-600"
        },
        {
          icon: <Activity className="w-5 h-5" />,
          label: "Operational costs",
          value: "-20%",
          improvement: "Resource optimization",
          color: "text-orange-600"
        }
      ]
    }

    return baseMetrics[businessType] || baseMetrics['E-commerce']
  }

  const metrics = getMetricsForBusiness(businessType)

  useEffect(() => {
    // Animate metrics appearing one by one
    const timer = setInterval(() => {
      setVisibleMetrics(prev => {
        if (prev.length < metrics.length) {
          return [...prev, prev.length]
        }
        clearInterval(timer)
        return prev
      })
    }, 300)

    return () => clearInterval(timer)
  }, [metrics.length])

  const calculateROI = () => {
    const setupTime = integrations.length * 2 // minutes per integration
    const weeklyTimeSaved = 10 // hours
    const weeksToROI = Math.ceil(setupTime / 60 / weeklyTimeSaved)
    return weeksToROI
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Value Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-green-600" />
              Expected Value for Your {businessType}
            </span>
            <Badge variant="default" className="bg-green-600">
              ROI in {calculateROI()} weeks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {metrics.map((metric, index) => (
                visibleMetrics.includes(index) && (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  >
                    <div className="bg-white rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-1", metric.color)}>
                          {metric.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {metric.label}
                            </h4>
                            <motion.span 
                              className={cn("text-lg font-bold", metric.color)}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              {metric.value}
                            </motion.span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {metric.improvement}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">
                  Total Impact Summary
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Based on similar {businessType.toLowerCase()} businesses
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  +42% efficiency
                </div>
                <div className="text-sm text-blue-700">
                  Average improvement
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Quick Setup Time */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Quick Setup</h4>
                <p className="text-sm text-gray-600">
                  Connect {integrations.length} tools in ~{integrations.length * 2} minutes
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      {/* Business-specific benefits */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-4">
          <h4 className="font-semibold text-purple-900 mb-3">
            Tailored for {businessType}
          </h4>
          <div className="space-y-2">
            {getBusinessSpecificBenefits(businessType).map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + index * 0.1 }}
                className="flex items-center gap-2 text-sm text-purple-800"
              >
                <Package className="w-4 h-4 text-purple-600" />
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getBusinessSpecificBenefits(businessType: string): string[] {
  const benefits = {
    'E-commerce': [
      'Real-time inventory tracking across all channels',
      'Customer lifetime value calculations',
      'Automated reorder point alerts',
      'Multi-channel sales analytics'
    ],
    'SaaS': [
      'Cohort analysis and retention tracking',
      'Feature usage heatmaps',
      'Automated churn prediction',
      'Revenue expansion opportunities'
    ],
    'Healthcare': [
      'HIPAA-compliant data handling',
      'Patient flow optimization',
      'Insurance claim tracking',
      'Appointment no-show predictions'
    ]
  }

  return benefits[businessType] || benefits['E-commerce']
}