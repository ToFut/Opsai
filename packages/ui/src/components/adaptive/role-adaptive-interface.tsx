"use client"

import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Shield,
  Crown,
  Users,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Award,
  TrendingUp,
  MessageCircle,
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share,
  Monitor,
  Smartphone,
  Tablet,
  Brain,
  Workflow
} from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useIntelligentState } from '../hooks/useIntelligentState';
import { ContextualAIChat } from '../ai/contextual-ai-chat';
import IntelligentDashboardWidget from '../widgets/intelligent-dashboard-widget';

interface UserRole {
  id: string;
  name: string;
  level: number;
  permissions: Permission[];
  uiAdaptations: UIAdaptation[];
  dataAccess: DataAccessRule[];
  workflowAccess: WorkflowAccessRule[];
  aiCapabilities: AICapability[];
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

interface UIAdaptation {
  component: string;
  modifications: ComponentModification[];
  visibility: VisibilityRule[];
  interactions: InteractionRule[];
  layout: LayoutRule[];
}

interface ComponentModification {
  property: string;
  value: any;
  condition?: string;
}

interface VisibilityRule {
  condition: string;
  visible: boolean;
  alternative?: string;
}

interface InteractionRule {
  action: string;
  enabled: boolean;
  condition?: string;
  customHandler?: string;
}

interface LayoutRule {
  breakpoint: string;
  layout: string;
  priority: number;
}

interface DataAccessRule {
  entity: string;
  operations: string[];
  filters: Record<string, any>;
  aggregationLevel?: 'individual' | 'team' | 'department' | 'organization';
}

interface WorkflowAccessRule {
  workflowId: string;
  permissions: string[];
  conditions?: string[];
}

interface AICapability {
  type: 'chat' | 'analysis' | 'prediction' | 'optimization' | 'recommendation';
  level: 'basic' | 'advanced' | 'expert';
  contexts: string[];
  limitations?: string[];
}

interface RoleAdaptiveInterfaceProps {
  currentUser: {
    id: string;
    role: string;
    permissions: string[];
    department?: string;
    teamId?: string;
    preferences?: UserPreferences;
  };
  businessContext: any;
  availableRoles: UserRole[];
  children?: React.ReactNode;
  onRoleSwitch?: (roleId: string) => void;
  onPermissionRequest?: (resource: string, action: string) => void;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  language: string;
  timezone: string;
  dashboardLayout: DashboardLayout[];
  notifications: NotificationPreferences;
  aiAssistance: AIAssistancePreferences;
}

interface DashboardLayout {
  widgetId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
}

interface NotificationPreferences {
  enabled: boolean;
  channels: string[];
  frequency: 'real-time' | 'digest' | 'weekly';
  categories: string[];
}

interface AIAssistancePreferences {
  enabled: boolean;
  proactivity: 'high' | 'medium' | 'low';
  contexts: string[];
  autoSuggestions: boolean;
}

export const RoleAdaptiveInterface: React.FC<RoleAdaptiveInterfaceProps> = ({
  currentUser,
  businessContext,
  availableRoles,
  children,
  onRoleSwitch,
  onPermissionRequest
}) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [adaptedComponents, setAdaptedComponents] = useState<Map<string, any>>(new Map());
  
  const { state: interfaceState, updateState } = useIntelligentState(
    `adaptive-interface-${currentUser.id}`,
    {
      currentRole: currentUser.role,
      adaptations: {},
      userInteractions: [],
      performanceMetrics: {},
      aiInsights: []
    }
  );

  const { getBusinessData } = useBusinessContext();

  // Get current user role configuration
  const currentRole = useMemo(() => {
    return availableRoles.find(role => role.id === currentUser.role) || availableRoles[0];
  }, [currentUser.role, availableRoles]);

  // Detect device type
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  // Check permission for a specific resource and action
  const hasPermission = (resource: string, action: string): boolean => {
    return currentRole.permissions.some(permission => {
      if (permission.resource === resource || permission.resource === '*') {
        if (permission.actions.includes(action) || permission.actions.includes('*')) {
          // Check conditions if any
          if (permission.conditions) {
            return permission.conditions.every(condition => {
              return evaluateCondition(condition, currentUser, businessContext);
            });
          }
          return true;
        }
      }
      return false;
    });
  };

  // Evaluate permission condition
  const evaluateCondition = (
    condition: PermissionCondition,
    user: any,
    context: any
  ): boolean => {
    const fieldValue = getNestedValue(user, condition.field) || getNestedValue(context, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(condition.value) : 
               String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) ? condition.value.includes(fieldValue) : false;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  };

  // Get nested value from object
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Get filtered data based on role access rules
  const getFilteredData = (entity: string, data: any[]): any[] => {
    const dataRule = currentRole.dataAccess.find(rule => rule.entity === entity);
    if (!dataRule) return [];

    let filteredData = data;

    // Apply filters
    if (dataRule.filters) {
      filteredData = data.filter(item => {
        return Object.entries(dataRule.filters).every(([key, value]) => {
          if (key === 'userId' && value === 'self') {
            return item.userId === currentUser.id;
          }
          if (key === 'teamId' && value === 'team') {
            return item.teamId === currentUser.teamId;
          }
          if (key === 'department' && value === 'department') {
            return item.department === currentUser.department;
          }
          return item[key] === value;
        });
      });
    }

    // Apply aggregation level
    if (dataRule.aggregationLevel) {
      switch (dataRule.aggregationLevel) {
        case 'individual':
          filteredData = filteredData.filter(item => item.userId === currentUser.id);
          break;
        case 'team':
          filteredData = filteredData.filter(item => item.teamId === currentUser.teamId);
          break;
        case 'department':
          filteredData = filteredData.filter(item => item.department === currentUser.department);
          break;
        case 'organization':
          // No additional filtering
          break;
      }
    }

    return filteredData;
  };

  // Adapt component based on role
  const adaptComponent = (componentName: string, baseComponent: React.ReactNode): React.ReactNode => {
    const adaptation = currentRole.uiAdaptations.find(adapt => adapt.component === componentName);
    if (!adaptation) return baseComponent;

    // Check visibility rules
    const visibilityRule = adaptation.visibility.find(rule => evaluateConditionString(rule.condition));
    if (visibilityRule && !visibilityRule.visible) {
      return visibilityRule.alternative ? (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <Lock size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">{visibilityRule.alternative}</p>
        </div>
      ) : null;
    }

    // Apply modifications
    const modifiedProps: any = {};
    adaptation.modifications.forEach(mod => {
      if (!mod.condition || evaluateConditionString(mod.condition)) {
        modifiedProps[mod.property] = mod.value;
      }
    });

    // Apply interaction rules
    const interactions: any = {};
    adaptation.interactions.forEach(interaction => {
      if (!interaction.condition || evaluateConditionString(interaction.condition)) {
        interactions[interaction.action] = {
          enabled: interaction.enabled,
          handler: interaction.customHandler
        };
      }
    });

    return React.cloneElement(baseComponent as React.ReactElement, {
      ...modifiedProps,
      interactions,
      roleAdaptation: {
        role: currentRole.name,
        level: currentRole.level,
        permissions: currentRole.permissions
      }
    });
  };

  // Evaluate condition string (simplified)
  const evaluateConditionString = (condition: string): boolean => {
    // This would be a more sophisticated condition evaluator in practice
    // For now, we'll handle basic cases
    if (condition === 'always') return true;
    if (condition === 'never') return false;
    if (condition.includes('role.level >')) {
      const level = parseInt(condition.split('>')[1]);
      return currentRole.level > level;
    }
    if (condition.includes('hasPermission')) {
      const match = condition.match(/hasPermission\('([^']+)',\s*'([^']+)'\)/);
      if (match) {
        return hasPermission(match[1], match[2]);
      }
    }
    return true;
  };

  // Get role-specific navigation items
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, permission: 'dashboard:view' },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp, permission: 'analytics:view' },
      { id: 'users', label: 'Users', icon: Users, permission: 'users:view' },
      { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings:view' },
      { id: 'workflows', label: 'Workflows', icon: Workflow, permission: 'workflows:view' }
    ];

    return baseItems.filter(item => hasPermission(item.permission.split(':')[0], item.permission.split(':')[1]));
  };

  // Get role-specific widgets for dashboard
  const getDashboardWidgets = () => {
    const allWidgets = [
      {
        id: 'overview-metrics',
        title: 'Key Metrics',
        type: 'metric' as const,
        size: 'medium' as const,
        permission: 'metrics:view',
        dataSource: 'overview-metrics',
        aiEnabled: true,
        realTimeUpdates: true,
        refreshInterval: 30
      },
      {
        id: 'team-performance',
        title: 'Team Performance',
        type: 'chart' as const,
        size: 'large' as const,
        permission: 'team:view',
        dataSource: 'team-performance',
        aiEnabled: true,
        realTimeUpdates: true,
        refreshInterval: 60
      },
      {
        id: 'ai-insights',
        title: 'AI Insights',
        type: 'insight' as const,
        size: 'large' as const,
        permission: 'insights:view',
        dataSource: 'ai-insights',
        aiEnabled: true,
        realTimeUpdates: false,
        refreshInterval: 300
      },
      {
        id: 'recent-activity',
        title: 'Recent Activity',
        type: 'table' as const,
        size: 'medium' as const,
        permission: 'activity:view',
        dataSource: 'recent-activity',
        aiEnabled: false,
        realTimeUpdates: true,
        refreshInterval: 15
      }
    ];

    return allWidgets.filter(widget => {
      const [resource, action] = widget.permission.split(':');
      return hasPermission(resource, action);
    });
  };

  // Handle role switch
  const handleRoleSwitch = (roleId: string) => {
    if (onRoleSwitch) {
      onRoleSwitch(roleId);
    }
    setShowRoleSelector(false);
    
    // Update state
    updateState({
      currentRole: roleId,
      userInteractions: [...interfaceState.userInteractions, {
        type: 'role-switch',
        from: currentUser.role,
        to: roleId,
        timestamp: new Date()
      }]
    });
  };

  // Handle permission request
  const handlePermissionRequest = (resource: string, action: string) => {
    if (onPermissionRequest) {
      onPermissionRequest(resource, action);
    }
    
    // Update state
    updateState({
      userInteractions: [...interfaceState.userInteractions, {
        type: 'permission-request',
        resource,
        action,
        timestamp: new Date()
      }]
    });
  };

  // Render navigation based on role and device
  const renderNavigation = () => {
    const navItems = getNavigationItems();
    
    if (deviceType === 'mobile') {
      return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around">
            {navItems.slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded ${
                  activeView === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-64 bg-gray-900 text-white min-h-screen">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">OpsAI Platform</h1>
            <div className="flex items-center space-x-2">
              {currentRole.aiCapabilities.length > 0 && (
                <Brain size={16} className="text-blue-400" title="AI-Enhanced Role" />
              )}
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                {currentRole.level >= 3 ? <Crown size={16} className="text-yellow-400" /> : 
                 currentRole.level >= 2 ? <Shield size={16} className="text-blue-400" /> :
                 <User size={16} />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          {showRoleSelector && (
            <div className="mb-6 bg-gray-800 rounded-lg p-3">
              <div className="mb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">Current Role:</span>
                  <span className="text-blue-400">{currentRole.name}</span>
                </div>
                <div className="text-xs text-gray-400">Level {currentRole.level}</div>
              </div>
              
              <div className="space-y-1">
                {availableRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSwitch(role.id)}
                    disabled={role.id === currentUser.role}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      role.id === currentUser.role 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{role.name}</span>
                      <span className="text-xs text-gray-400">L{role.level}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation items */}
          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                  activeView === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Role-specific AI capabilities */}
          {currentRole.aiCapabilities.length > 0 && (
            <div className="mt-6 p-3 bg-blue-900 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain size={16} className="text-blue-300" />
                <span className="text-sm font-medium text-blue-100">AI Capabilities</span>
              </div>
              <div className="space-y-1">
                {currentRole.aiCapabilities.map((capability, index) => (
                  <div key={index} className="text-xs text-blue-200">
                    {capability.type} ({capability.level})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render main content based on active view and role
  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'analytics':
        return renderAnalytics();
      case 'users':
        return renderUsers();
      case 'workflows':
        return renderWorkflows();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    const widgets = getDashboardWidgets();
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser.role} view</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Role: {currentRole.name}</span>
            <div className="flex items-center space-x-1">
              {deviceType === 'desktop' && <Monitor size={16} className="text-blue-500" />}
              {deviceType === 'tablet' && <Tablet size={16} className="text-blue-500" />}
              {deviceType === 'mobile' && <Smartphone size={16} className="text-blue-500" />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {widgets.map(widget => (
            <IntelligentDashboardWidget
              key={widget.id}
              config={widget}
              businessContext={businessContext}
              onActionExecute={async (action) => {
                console.log('Executing action:', action);
              }}
              onDrillDown={(metric, filters) => {
                console.log('Drilling down:', metric, filters);
              }}
            />
          ))}
        </div>

        {widgets.length === 0 && (
          <div className="text-center py-12">
            <Lock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Access</h3>
            <p className="text-gray-600 mb-4">
              Your current role ({currentRole.name}) doesn't have access to dashboard widgets.
            </p>
            <button
              onClick={() => handlePermissionRequest('dashboard', 'view')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Request Access
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!hasPermission('analytics', 'view')) {
      return (
        <div className="p-6 text-center">
          <Lock size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to view analytics.
          </p>
          <button
            onClick={() => handlePermissionRequest('analytics', 'view')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Request Access
          </button>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Analytics content for {currentRole.name} role</p>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (!hasPermission('users', 'view')) {
      return (
        <div className="p-6 text-center">
          <Lock size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You don't have permission to view users.</p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">User management for {currentRole.name} role</p>
        </div>
      </div>
    );
  };

  const renderWorkflows = () => {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Workflows</h1>
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <Workflow size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Workflow management for {currentRole.name} role</p>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Settings for {currentRole.name} role</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Navigation */}
      {deviceType !== 'mobile' && renderNavigation()}

      {/* Main content */}
      <div className={`flex-1 ${deviceType === 'mobile' ? 'pb-20' : ''} overflow-y-auto`}>
        {renderMainContent()}
      </div>

      {/* Mobile navigation */}
      {deviceType === 'mobile' && renderNavigation()}

      {/* AI Chat - available based on role capabilities */}
      {currentRole.aiCapabilities.some(cap => cap.type === 'chat') && (
        <ContextualAIChat
          businessContext={{
            industry: businessContext.industry,
            userRole: currentRole.name,
            currentView: activeView,
            userData: currentUser,
            permissions: currentRole.permissions.map(p => `${p.resource}:${p.actions.join(',')}`),
            activeWorkflows: []
          }}
          onActionExecute={async (action, params) => {
            console.log('AI Chat action:', action, params);
          }}
          onInsightDrill={(insight) => {
            console.log('AI Chat insight:', insight);
          }}
        />
      )}

      {children}
    </div>
  );
};

export default RoleAdaptiveInterface;