"use client";

import { UserIcon, CameraIcon, UsersIcon, CheckCircleIcon } from '../lib/config/icons';

interface RoleConfig {
    id: string;
    icon: React.ComponentType;
    title: string;
    description: string;
    features: string[];
}

interface StartPageProps {
    onSelectRole: (role: string) => void;
}

const roleConfigs: RoleConfig[] = [
    {
        id: 'Client',
        icon: UserIcon,
        title: 'Client',
        description: 'Looking to hire a photographer',
        features: ['Define project requirements', 'Set budget and timeline', 'Review and approve shots']
    },
    {
        id: 'Photographer',
        icon: CameraIcon,
        title: 'Photographer',
        description: 'Planning your own shoot',
        features: ['Technical shot planning', 'Equipment management', 'Create call sheets']
    },
    {
        id: 'Producer',
        icon: UsersIcon,
        title: 'Producer',
        description: 'Managing the production',
        features: ['Coordinate team logistics', 'Manage multiple shoots', 'Budget oversight']
    }
];

export function StartPage({ onSelectRole }: StartPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                    Welcome to the Photography Brief Builder
                </h1>
                <p className="text-lg text-center text-gray-600 mb-12">
                    Select your role to get started with a customized brief experience
                </p>
                
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                    {roleConfigs.map(role => (
                        <button
                            key={role.id}
                            onClick={() => onSelectRole(role.id)}
                            className="relative bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-left border-2 border-transparent hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl mb-4">
                                <role.icon />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {role.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {role.description}
                            </p>
                            <ul className="space-y-2">
                                {role.features.map((feature, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-center">
                                        <CheckCircleIcon />
                                        <span className="ml-2">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}