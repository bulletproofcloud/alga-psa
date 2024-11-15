'use client';

import React, { useState, useEffect } from 'react';
import { Asset, CreateAssetRequest, WorkstationAsset, NetworkDeviceAsset, ServerAsset, MobileDeviceAsset, PrinterAsset } from '@/interfaces/asset.interfaces';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getAsset, updateAsset } from '@/lib/actions/asset-actions/assetActions';
import { useRouter } from 'next/navigation';
import { 
  Monitor,
  Network,
  Server,
  Smartphone,
  Printer as PrinterIcon,
  Router,
  Shield,
  Radio,
  Scale
} from 'lucide-react';
import { Text } from '@radix-ui/themes';

interface AssetFormProps {
  assetId: string;
}

type AssetFormData = Omit<CreateAssetRequest, 'workstation' | 'networkDevice' | 'server' | 'mobileDevice' | 'printer'> & {
  workstation?: Omit<WorkstationAsset, 'tenant' | 'asset_id'>;
  networkDevice?: Omit<NetworkDeviceAsset, 'tenant' | 'asset_id'>;
  server?: Omit<ServerAsset, 'tenant' | 'asset_id'>;
  mobileDevice?: Omit<MobileDeviceAsset, 'tenant' | 'asset_id'>;
  printer?: Omit<PrinterAsset, 'tenant' | 'asset_id'>;
};


const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' }
];

const NETWORK_DEVICE_TYPES = [
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'access_point', label: 'Access Point' },
  { value: 'load_balancer', label: 'Load Balancer' }
];

const STORAGE_TYPES = [
  { value: 'ssd', label: 'SSD' },
  { value: 'hdd', label: 'HDD' },
  { value: 'nvme', label: 'NVMe' }
];

const OS_TYPES = [
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' }
];

export default function AssetForm({ assetId }: AssetFormProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssetFormData>({
    type_id: '',
    company_id: '',
    name: '',
    asset_tag: '',
    serial_number: '',
    status: '',
    location: '',
    purchase_date: '',
    warranty_end_date: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const data = await getAsset(assetId);
        if (!data) {
          setError('Asset not found');
          return;
        }
        setAsset(data);
        
        const purchaseDate = typeof data.purchase_date === 'string' 
          ? data.purchase_date.split('T')[0] 
          : '';
          
        const warrantyEndDate = typeof data.warranty_end_date === 'string'
          ? data.warranty_end_date.split('T')[0]
          : '';
  
        setFormData({
          type_id: data.type_id,
          company_id: data.company_id,
          name: data.name || '',
          asset_tag: data.asset_tag || '',
          serial_number: data.serial_number || '',
          status: data.status || 'active',
          location: data.location || '',
          purchase_date: purchaseDate,
          warranty_end_date: warrantyEndDate,
          workstation: data.workstation ? {
            os_type: data.workstation.os_type || '',
            os_version: data.workstation.os_version || '',
            cpu_model: data.workstation.cpu_model || '',
            cpu_cores: data.workstation.cpu_cores || 0,
            ram_gb: data.workstation.ram_gb || 0,
            storage_type: data.workstation.storage_type || '',
            storage_capacity_gb: data.workstation.storage_capacity_gb || 0,
            gpu_model: data.workstation.gpu_model || '',
            installed_software: data.workstation.installed_software || []
          } : undefined,
          networkDevice: data.networkDevice ? {
            device_type: data.networkDevice.device_type || '',
            management_ip: data.networkDevice.management_ip || '',
            port_count: data.networkDevice.port_count || 0,
            firmware_version: data.networkDevice.firmware_version || '',
            supports_poe: data.networkDevice.supports_poe || false,
            power_draw_watts: data.networkDevice.power_draw_watts || 0,
            vlan_config: data.networkDevice.vlan_config || {},
            port_config: data.networkDevice.port_config || {}
          } : undefined,
          server: data.server ? {
            os_type: data.server.os_type || '',
            os_version: data.server.os_version || '',
            cpu_model: data.server.cpu_model || '',
            cpu_cores: data.server.cpu_cores || 0,
            ram_gb: data.server.ram_gb || 0,
            storage_config: data.server.storage_config || [],
            raid_config: data.server.raid_config || '',
            is_virtual: data.server.is_virtual || false,
            hypervisor: data.server.hypervisor || '',
            network_interfaces: data.server.network_interfaces || [],
            primary_ip: data.server.primary_ip || '',
            installed_services: data.server.installed_services || []
          } : undefined,
          mobileDevice: data.mobileDevice ? {
            os_type: data.mobileDevice.os_type || '',
            os_version: data.mobileDevice.os_version || '',
            model: data.mobileDevice.model || '',
            imei: data.mobileDevice.imei || '',
            phone_number: data.mobileDevice.phone_number || '',
            carrier: data.mobileDevice.carrier || '',
            is_supervised: data.mobileDevice.is_supervised || false,
            installed_apps: data.mobileDevice.installed_apps || []
          } : undefined,
          printer: data.printer ? {
            model: data.printer.model || '',
            ip_address: data.printer.ip_address || '',
            is_network_printer: data.printer.is_network_printer || false,
            supports_color: data.printer.supports_color || false,
            supports_duplex: data.printer.supports_duplex || false,
            max_paper_size: data.printer.max_paper_size || 0,
            supported_paper_types: data.printer.supported_paper_types || [],
            monthly_duty_cycle: data.printer.monthly_duty_cycle || 0,
            supply_levels: data.printer.supply_levels || {}
          } : undefined
        });
      } catch (error) {
        console.error('Error loading asset:', error);
        setError('Failed to load asset details');
      } finally {
        setLoading(false);
      }
    };
  
    loadAsset();
  }, [assetId]);

  const getAssetTypeIcon = () => {
    const iconClass = "h-16 w-16 text-primary-500 mb-4";
    
    if (asset?.workstation) return <Monitor className={iconClass} />;
    if (asset?.networkDevice) {
      switch (asset.networkDevice.device_type) {
        case 'switch': return <Network className={iconClass} />;
        case 'router': return <Router className={iconClass} />;
        case 'firewall': return <Shield className={iconClass} />;
        case 'access_point': return <Radio className={iconClass} />;
        case 'load_balancer': return <Scale className={iconClass} />;
        default: return <Network className={iconClass} />;
      }
    }
    if (asset?.server) return <Server className={iconClass} />;
    if (asset?.mobileDevice) return <Smartphone className={iconClass} />;
    if (asset?.printer) return <PrinterIcon className={iconClass} />;
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeSpecificChange = (type: keyof AssetFormData, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...(prev[type] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const handleSelectChange = (value: string, field: string = 'status') => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderWorkstationFields = () => {
    if (!asset?.workstation) return null;
    if (!formData.workstation) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Type
          </label>
          <Select
            value={formData.workstation.os_type || ''}
            onChange={(value) => handleTypeSpecificChange('workstation', 'os_type', value)}
            options={OS_TYPES}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Version
          </label>
          <Input
            value={formData.workstation.os_version || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'os_version', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            CPU Model
          </label>
          <Input
            value={formData.workstation.cpu_model || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'cpu_model', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            CPU Cores
          </label>
          <Input
            type="number"
            value={formData.workstation.cpu_cores || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'cpu_cores', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            RAM (GB)
          </label>
          <Input
            type="number"
            value={formData.workstation.ram_gb || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'ram_gb', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Storage Type
          </label>
          <Select
            value={formData.workstation.storage_type || ''}
            onChange={(value) => handleTypeSpecificChange('workstation', 'storage_type', value)}
            options={STORAGE_TYPES}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Storage Capacity (GB)
          </label>
          <Input
            type="number"
            value={formData.workstation.storage_capacity_gb || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'storage_capacity_gb', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            GPU Model
          </label>
          <Input
            value={formData.workstation.gpu_model || ''}
            onChange={(e) => handleTypeSpecificChange('workstation', 'gpu_model', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    );
  };

  const renderNetworkDeviceFields = () => {
    if (!asset?.networkDevice) return null;
    if (!formData.networkDevice) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Device Type
          </label>
          <Select
            value={formData.networkDevice.device_type || ''}
            onChange={(value) => handleTypeSpecificChange('networkDevice', 'device_type', value)}
            options={NETWORK_DEVICE_TYPES}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Management IP
          </label>
          <Input
            value={formData.networkDevice.management_ip || ''}
            onChange={(e) => handleTypeSpecificChange('networkDevice', 'management_ip', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Port Count
          </label>
          <Input
            type="number"
            value={formData.networkDevice.port_count || ''}
            onChange={(e) => handleTypeSpecificChange('networkDevice', 'port_count', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Firmware Version
          </label>
          <Input
            value={formData.networkDevice.firmware_version || ''}
            onChange={(e) => handleTypeSpecificChange('networkDevice', 'firmware_version', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Power Draw (Watts)
          </label>
          <Input
            type="number"
            value={formData.networkDevice.power_draw_watts || ''}
            onChange={(e) => handleTypeSpecificChange('networkDevice', 'power_draw_watts', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.networkDevice.supports_poe || false}
              onChange={(e) => handleTypeSpecificChange('networkDevice', 'supports_poe', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Supports PoE</span>
          </label>
        </div>
      </div>
    );
  };

  const renderServerFields = () => {
    if (!asset?.server) return null;
    if (!formData.server) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Type
          </label>
          <Select
            value={formData.server.os_type || ''}
            onChange={(value) => handleTypeSpecificChange('server', 'os_type', value)}
            options={OS_TYPES}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Version
          </label>
          <Input
            value={formData.server.os_version || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'os_version', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            CPU Model
          </label>
          <Input
            value={formData.server.cpu_model || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'cpu_model', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            CPU Cores
          </label>
          <Input
            type="number"
            value={formData.server.cpu_cores || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'cpu_cores', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            RAM (GB)
          </label>
          <Input
            type="number"
            value={formData.server.ram_gb || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'ram_gb', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Primary IP
          </label>
          <Input
            value={formData.server.primary_ip || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'primary_ip', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            RAID Config
          </label>
          <Input
            value={formData.server.raid_config || ''}
            onChange={(e) => handleTypeSpecificChange('server', 'raid_config', e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.server.is_virtual || false}
              onChange={(e) => handleTypeSpecificChange('server', 'is_virtual', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Virtual Machine</span>
          </label>
        </div>
        {formData.server.is_virtual && (
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
              Hypervisor
            </label>
            <Input
              value={formData.server.hypervisor || ''}
              onChange={(e) => handleTypeSpecificChange('server', 'hypervisor', e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </div>
    );
  };

  const renderMobileDeviceFields = () => {
    if (!asset?.mobileDevice) return null;
    if (!formData.mobileDevice) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Type
          </label>
          <Select
            value={formData.mobileDevice.os_type || ''}
            onChange={(value) => handleTypeSpecificChange('mobileDevice', 'os_type', value)}
            options={[
              { value: 'ios', label: 'iOS' },
              { value: 'android', label: 'Android' }
            ]}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            OS Version
          </label>
          <Input
            value={formData.mobileDevice.os_version || ''}
            onChange={(e) => handleTypeSpecificChange('mobileDevice', 'os_version', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Model
          </label>
          <Input
            value={formData.mobileDevice.model || ''}
            onChange={(e) => handleTypeSpecificChange('mobileDevice', 'model', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            IMEI
          </label>
          <Input
            value={formData.mobileDevice.imei || ''}
            onChange={(e) => handleTypeSpecificChange('mobileDevice', 'imei', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Phone Number
          </label>
          <Input
            value={formData.mobileDevice.phone_number || ''}
            onChange={(e) => handleTypeSpecificChange('mobileDevice', 'phone_number', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Carrier
          </label>
          <Input
            value={formData.mobileDevice.carrier || ''}
            onChange={(e) => handleTypeSpecificChange('mobileDevice', 'carrier', e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.mobileDevice.is_supervised || false}
              onChange={(e) => handleTypeSpecificChange('mobileDevice', 'is_supervised', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Supervised Device</span>
          </label>
        </div>
      </div>
    );
  };

  const renderPrinterFields = () => {
    if (!asset?.printer) return null;
    if (!formData.printer) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Model
          </label>
          <Input
            value={formData.printer.model || ''}
            onChange={(e) => handleTypeSpecificChange('printer', 'model', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            IP Address
          </label>
          <Input
            value={formData.printer.ip_address || ''}
            onChange={(e) => handleTypeSpecificChange('printer', 'ip_address', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
            Monthly Duty Cycle
          </label>
          <Input
            type="number"
            value={formData.printer.monthly_duty_cycle || ''}
            onChange={(e) => handleTypeSpecificChange('printer', 'monthly_duty_cycle', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.printer.is_network_printer || false}
              onChange={(e) => handleTypeSpecificChange('printer', 'is_network_printer', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Network Printer</span>
          </label>
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.printer.supports_color || false}
              onChange={(e) => handleTypeSpecificChange('printer', 'supports_color', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Color Support</span>
          </label>
          <label className="flex items-center space-x-2 text-sm font-medium text-[rgb(var(--color-text-700))]">
            <input
              type="checkbox"
              checked={formData.printer.supports_duplex || false}
              onChange={(e) => handleTypeSpecificChange('printer', 'supports_duplex', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Duplex Support</span>
          </label>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!asset) return;

    setSaving(true);
    setError(null);

    try {
      await updateAsset(assetId, formData);
      router.push(`/msp/assets/${assetId}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating asset:', error);
      setError('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading asset details...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error || 'Asset not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-900))]">Edit Asset</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-[rgb(var(--color-border-200))]">
          <div className="flex flex-col items-center mb-6">
            {getAssetTypeIcon()}
            <Text size="5" weight="medium" className="text-[rgb(var(--color-text-900))]">
              Basic Information
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="asset_tag" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Asset Tag
                </label>
                <Input
                  id="asset_tag"
                  name="asset_tag"
                  value={formData.asset_tag}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="serial_number" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Serial Number
                </label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Status
                </label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  options={STATUS_OPTIONS}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Purchase Date
                </label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="warranty_end_date" className="block text-sm font-medium text-[rgb(var(--color-text-700))]">
                  Warranty End Date
                </label>
                <Input
                  id="warranty_end_date"
                  name="warranty_end_date"
                  type="date"
                  value={formData.warranty_end_date}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {(asset.workstation || asset.networkDevice || asset.server || asset.mobileDevice || asset.printer) && (
          <Card className="p-6 border border-[rgb(var(--color-border-200))]">
            <Text size="5" weight="medium" className="block mb-6 text-[rgb(var(--color-text-900))]">
              {asset.workstation ? 'Workstation Details' :
               asset.networkDevice ? 'Network Device Details' :
               asset.server ? 'Server Details' :
               asset.mobileDevice ? 'Mobile Device Details' :
               'Printer Details'}
            </Text>
            {asset.workstation && renderWorkstationFields()}
            {asset.networkDevice && renderNetworkDeviceFields()}
            {asset.server && renderServerFields()}
            {asset.mobileDevice && renderMobileDeviceFields()}
            {asset.printer && renderPrinterFields()}
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
