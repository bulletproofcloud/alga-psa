'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Asset, AssetListResponse, ClientMaintenanceSummary } from '@/interfaces/asset.interfaces';
import { getClientMaintenanceSummary } from '@/lib/actions/asset-actions/assetActions';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

interface AssetDashboardProps {
  initialAssets: AssetListResponse;
}

export default function AssetDashboard({ initialAssets }: AssetDashboardProps) {
  const [assets] = useState<Asset[]>(initialAssets.assets);
  const [maintenanceSummaries, setMaintenanceSummaries] = useState<Record<string, ClientMaintenanceSummary>>({});
  const [loading, setLoading] = useState(false);

  // Group assets by company
  const assetsByCompany = assets.reduce((acc, asset) => {
    if (!asset.company_id) return acc;
    if (!acc[asset.company_id]) {
      acc[asset.company_id] = [];
    }
    acc[asset.company_id].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Calculate overall statistics
  const totalAssets = assets.length;
  const assetsByStatus = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    async function loadMaintenanceSummaries() {
      setLoading(true);
      try {
        const summaries: Record<string, ClientMaintenanceSummary> = {};
        for (const companyId of Object.keys(assetsByCompany)) {
          const summary = await getClientMaintenanceSummary(companyId);
          summaries[companyId] = summary;
        }
        setMaintenanceSummaries(summaries);
      } catch (error) {
        console.error('Error loading maintenance summaries:', error);
      }
      setLoading(false);
    }

    loadMaintenanceSummaries();
  }, []);

  // Calculate maintenance statistics
  const maintenanceStats = Object.values(maintenanceSummaries).reduce(
    (acc, summary) => {
      acc.totalSchedules += summary.total_schedules;
      acc.overdueMaintenances += summary.overdue_maintenances;
      acc.upcomingMaintenances += summary.upcoming_maintenances;
      return acc;
    },
    { totalSchedules: 0, overdueMaintenances: 0, upcomingMaintenances: 0 }
  );

  const columns: ColumnDefinition<Asset>[] = [
    { 
      dataIndex: 'name',
      title: 'Name'
    },
    { 
      dataIndex: 'asset_tag',
      title: 'Tag'
    },
    { 
      dataIndex: 'status',
      title: 'Status'
    },
    { 
      dataIndex: ['company', 'company_name'],
      title: 'Company',
      render: (value: unknown, record: Asset) => {
        return record.company?.company_name || 'Unassigned';
      }
    },
    {
      dataIndex: 'location',
      title: 'Location',
      render: (value: unknown) => (value as string) || 'Not specified'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-[rgb(var(--color-border-200))]">
          <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--color-text-900))]">Total Assets</h3>
          <p className="text-3xl font-bold text-[rgb(var(--color-text-900))]">{totalAssets}</p>
        </Card>
        
        <Card className="p-4 border border-[rgb(var(--color-border-200))]">
          <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--color-text-900))]">Maintenance Schedules</h3>
          <p className="text-3xl font-bold text-[rgb(var(--color-text-900))]">{maintenanceStats.totalSchedules}</p>
        </Card>
        
        <Card className="p-4 border border-[rgb(var(--color-border-200))]">
          <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--color-text-900))]">Overdue Maintenance</h3>
          <p className="text-3xl font-bold text-[rgb(var(--color-accent-500))]">
            {maintenanceStats.overdueMaintenances}
          </p>
        </Card>
        
        <Card className="p-4 border border-[rgb(var(--color-border-200))]">
          <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--color-text-900))]">Upcoming Maintenance</h3>
          <p className="text-3xl font-bold text-[rgb(var(--color-primary-500))]">
            {maintenanceStats.upcomingMaintenances}
          </p>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card className="p-4 border border-[rgb(var(--color-border-200))]">
        <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text-900))]">Asset Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(assetsByStatus).map(([status, count]):JSX.Element => (
            <div key={status} className="text-center p-4 rounded-lg bg-[rgb(var(--color-border-50))]">
              <p className="text-lg font-medium text-[rgb(var(--color-text-700))]">{status}</p>
              <p className="text-2xl font-bold text-[rgb(var(--color-text-900))]">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Company Assets Overview */}
      <Card className="p-4 border border-[rgb(var(--color-border-200))]">
        <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text-900))]">Assets by Company</h3>
        <div className="space-y-4">
          {Object.entries(assetsByCompany).map(([companyId, companyAssets]):JSX.Element => {
            const summary = maintenanceSummaries[companyId];
            const companyName = companyAssets[0]?.company?.company_name || 'Unassigned';
            return (
              <div key={companyId} className="border border-[rgb(var(--color-border-200))] rounded-lg p-4 bg-[rgb(var(--color-border-50))]">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-medium text-[rgb(var(--color-text-900))]">
                    {companyName}
                  </h4>
                  <span className="text-sm text-[rgb(var(--color-text-600))]">
                    {companyAssets.length} assets
                  </span>
                </div>
                {summary && (
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-[rgb(var(--color-text-600))]">Maintenance Compliance</p>
                      <p className="font-semibold text-[rgb(var(--color-text-900))]">
                        {summary.compliance_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--color-text-600))]">Overdue</p>
                      <p className="font-semibold text-[rgb(var(--color-accent-500))]">
                        {summary.overdue_maintenances}
                      </p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--color-text-600))]">Upcoming</p>
                      <p className="font-semibold text-[rgb(var(--color-primary-500))]">
                        {summary.upcoming_maintenances}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Assets Table */}
      <Card className="p-4 border border-[rgb(var(--color-border-200))]">
        <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-text-900))]">Recent Assets</h3>
        <DataTable
          columns={columns}
          data={assets.slice(0, 5)}
          pagination={false}
        />
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg text-[rgb(var(--color-text-900))]">
            Loading maintenance data...
          </div>
        </div>
      )}
    </div>
  );
}
