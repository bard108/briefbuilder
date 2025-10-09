'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FormData } from '@/lib/schemas/brief-schema';

export default function SharePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [briefData, setBriefData] = useState<FormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get encoded data from URL params
      const encodedData = searchParams.get('d');
      if (!encodedData) {
        setError('No brief data found in share link');
        setLoading(false);
        return;
      }

      // Decode and decompress the data
      const jsonStr = atob(encodedData);
      const data = JSON.parse(jsonStr) as FormData;
      setBriefData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error decoding brief data:', err);
      setError('Invalid share link. The link may be corrupted or expired.');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading brief...</p>
        </div>
      </div>
    );
  }

  if (error || !briefData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Brief</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Brief
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {briefData.projectName || 'Untitled Project'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Shared Production Brief
              </p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">View Only</span>
            </div>
          </div>
          {briefData.overview && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{briefData.overview}</p>
            </div>
          )}
        </div>

        {/* Client Information */}
        {(briefData.clientName || briefData.clientCompany) && (
          <Section title="Client Information">
            <InfoRow label="Name" value={briefData.clientName} />
            <InfoRow label="Company" value={briefData.clientCompany} />
            <InfoRow label="Email" value={briefData.clientEmail} />
            <InfoRow label="Phone" value={briefData.clientPhone} />
          </Section>
        )}

        {/* Project Details */}
        <Section title="Project Details">
          <InfoRow label="Project Type" value={briefData.projectType} />
          <InfoRow label="Budget" value={briefData.budget} />
          <InfoRow label="Objectives" value={briefData.objectives} />
          <InfoRow label="Target Audience" value={briefData.audience} />
          {briefData.brandGuidelines && <InfoRow label="Brand Guidelines" value={briefData.brandGuidelines} />}
          {briefData.styleReferences && <InfoRow label="Style References" value={briefData.styleReferences} />}
          {briefData.competitorNotes && <InfoRow label="Competitor Notes" value={briefData.competitorNotes} />}
          {briefData.legalRequirements && <InfoRow label="Legal Requirements" value={briefData.legalRequirements} />}
        </Section>

        {/* Shoot Details */}
        {(briefData.shootDates || briefData.location) && (
          <Section title="Shoot Details">
            <InfoRow label="Date(s)" value={briefData.shootDates} />
            <InfoRow label="Start Time" value={briefData.shootStartTime} />
            <InfoRow label="Finish Time" value={briefData.shootFinishTime} />
            <InfoRow label="Status" value={briefData.shootStatus} />
            <InfoRow label="Location" value={briefData.location} />
            {briefData.locationDetails && (
              <>
                <InfoRow label="Address" value={briefData.locationDetails.address} />
                <InfoRow label="Parking" value={briefData.locationDetails.parkingInfo} />
                <InfoRow label="Access Notes" value={briefData.locationDetails.accessNotes} />
                {(briefData.locationDetails.sunrise || briefData.locationDetails.sunset) && (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Sunrise" value={briefData.locationDetails.sunrise} />
                    <InfoRow label="Sunset" value={briefData.locationDetails.sunset} />
                  </div>
                )}
                <InfoRow label="Weather" value={briefData.locationDetails.weatherSummary} />
              </>
            )}
          </Section>
        )}

        {/* Logistics */}
        {(briefData.permitsRequired || briefData.insuranceDetails || briefData.safetyProtocols || briefData.transportationDetails || briefData.accommodationDetails) && (
          <Section title="Production Logistics">
            <InfoRow label="Permits Required" value={briefData.permitsRequired} />
            <InfoRow label="Insurance" value={briefData.insuranceDetails} />
            <InfoRow label="Safety Protocols" value={briefData.safetyProtocols} />
            <InfoRow label="Backup Plan" value={briefData.backupPlan} />
            <InfoRow label="Power Requirements" value={briefData.powerRequirements} />
            <InfoRow label="Internet Needed" value={briefData.internetRequired ? 'Yes' : 'No'} />
            <InfoRow label="Catering" value={briefData.cateringNotes} />
            <InfoRow label="Transportation" value={briefData.transportationDetails} />
            <InfoRow label="Accommodation" value={briefData.accommodationDetails} />
          </Section>
        )}

        {/* Creative Direction */}
        {briefData.moodboardLink && (
          <Section title="Creative Direction">
            <InfoRow label="Mood Board" value={briefData.moodboardLink} link />
          </Section>
        )}

        {/* Deliverables */}
        {briefData.deliverables && briefData.deliverables.length > 0 && (
          <Section title="Deliverables">
            <div className="space-y-2">
              {briefData.deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            {briefData.fileTypes && briefData.fileTypes.length > 0 && (
              <InfoRow label="File Formats" value={briefData.fileTypes.join(', ')} />
            )}
            {briefData.usageRights && briefData.usageRights.length > 0 && (
              <InfoRow label="Usage Rights" value={briefData.usageRights.join(', ')} />
            )}
            {briefData.socialPlatforms && briefData.socialPlatforms.length > 0 && (
              <InfoRow label="Social Platforms" value={briefData.socialPlatforms.join(', ')} />
            )}
          </Section>
        )}

        {/* Video Specifications */}
        {(briefData.videoDuration || briefData.videoFrameRate || briefData.videoResolution || briefData.videoOrientation || briefData.motionRequirements) && (
          <Section title="📹 Video Specifications">
            <InfoRow label="Duration" value={briefData.videoDuration} />
            <InfoRow label="Frame Rate" value={briefData.videoFrameRate} />
            <InfoRow label="Resolution" value={briefData.videoResolution} />
            {briefData.videoOrientation && briefData.videoOrientation.length > 0 && (
              <InfoRow label="Orientations" value={briefData.videoOrientation.join(', ')} />
            )}
            <InfoRow label="Motion Requirements" value={briefData.motionRequirements} />
          </Section>
        )}

        {/* Post-Production */}
        {(briefData.editingRequirements || briefData.colorGradingNotes || briefData.turnaroundTime) && (
          <Section title="Post-Production">
            <InfoRow label="Editing Requirements" value={briefData.editingRequirements} />
            <InfoRow label="Color Grading" value={briefData.colorGradingNotes} />
            <InfoRow label="Turnaround Time" value={briefData.turnaroundTime} />
            <InfoRow label="Revision Rounds" value={briefData.revisionRounds} />
            <InfoRow label="Final Delivery Format" value={briefData.finalDeliveryFormat} />
          </Section>
        )}

        {/* Shot List */}
        {briefData.shotList && briefData.shotList.length > 0 && (
          <Section title={`Shot List (${briefData.shotList.length} shots)`}>
            <div className="space-y-3">
              {briefData.shotList.map((shot, idx) => (
                <div key={shot.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">Shot {idx + 1}</span>
                      {shot.quantity && shot.quantity > 1 && (
                        <span className="text-xs font-semibold text-gray-600 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-2 py-0.5 rounded">×{shot.quantity}</span>
                      )}
                      {shot.category && (
                        <span className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600">{shot.category}</span>
                      )}
                      {shot.priority && (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">Priority</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{shot.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{shot.shotType}</span>
                    <span>•</span>
                    <span>{shot.angle}</span>
                    {shot.orientation && (
                      <>
                        <span>•</span>
                        <span>{shot.orientation}</span>
                      </>
                    )}
                    {shot.equipment && shot.equipment.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Equipment: {shot.equipment.join(', ')}</span>
                      </>
                    )}
                  </div>
                  {shot.notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">Notes: {shot.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Crew */}
        {briefData.crew && briefData.crew.length > 0 && (
          <Section title="Crew">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Call Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {briefData.crew.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{member.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{member.callTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{member.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Budget */}
        {briefData.budgetLineItems && briefData.budgetLineItems.length > 0 && (
          <Section title="Budget">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {briefData.budgetLineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-right">${item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-semibold text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">Total:</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">
                      ${briefData.budgetLineItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your Own Brief
          </a>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Created with BriefBuilder • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, link = false }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}:</dt>
      <dd className="text-sm text-gray-900 dark:text-white col-span-2">
        {link && value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
