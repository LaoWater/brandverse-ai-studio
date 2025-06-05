
import { useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CompanySelector = () => {
  const { selectedCompany, companies, selectCompany } = useCompany();
  const navigate = useNavigate();

  if (!selectedCompany && companies.length === 0) {
    return (
      <Card className="cosmic-card">
        <CardContent className="p-4 text-center">
          <div className="text-gray-400 mb-4">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No companies yet</p>
          </div>
          <Button 
            onClick={() => navigate('/brand-setup')}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Company
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-between bg-white/5 border-white/20 text-white hover:bg-white/10 min-w-[200px]"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">
              {selectedCompany?.name || 'Select Company'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-gray-900 border-white/20">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => selectCompany(company)}
            className="text-white hover:bg-white/10 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{company.name}</span>
              {selectedCompany?.id === company.id && (
                <Badge variant="outline" className="ml-2 border-accent text-accent">
                  Active
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem
          onClick={() => navigate('/brand-setup')}
          className="text-accent hover:bg-white/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Company
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
