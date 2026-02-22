import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Shield } from 'lucide-react';
import type { WebsiteTechnicalDetails } from '@/services/seoService';

interface WebsiteAuditSectionProps {
  data: WebsiteTechnicalDetails;
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-400' },
  warning: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', badge: 'bg-blue-500/20 text-blue-400' },
};

const WebsiteAuditSection: React.FC<WebsiteAuditSectionProps> = ({ data }) => {
  const criticalIssues = data.issues.filter(i => i.severity === 'critical');
  const warningIssues = data.issues.filter(i => i.severity === 'warning');
  const infoIssues = data.issues.filter(i => i.severity === 'info');

  return (
    <div className="space-y-4">
      {/* JS-dependent callout */}
      {data.js_dependent_content && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-semibold text-sm">Your App Works. Indexing Doesn't.</h4>
              <p className="text-red-300/80 text-xs mt-1">
                Search engines see significantly less content than browsers. Your site relies on JavaScript rendering that Google may not fully execute.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tech stack badges */}
      {data.tech_stack.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {data.tech_stack.map((tech, i) => (
              <Badge
                key={i}
                variant="outline"
                className={`text-xs ${tech.ssr ? 'border-green-500/30 text-green-400' : 'border-amber-500/30 text-amber-400'}`}
              >
                {tech.name}
                {tech.ssr && <CheckCircle2 className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick status checks */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Meta Title', ok: data.has_meta_title },
          { label: 'Meta Description', ok: data.has_meta_description },
          { label: 'OG Tags', ok: data.has_og_tags },
          { label: 'Canonical URL', ok: data.has_canonical_url },
          { label: 'robots.txt', ok: data.has_robots_txt },
          { label: 'Sitemap', ok: data.has_sitemap },
        ].map(check => (
          <div key={check.label} className="flex items-center gap-2 text-sm">
            {check.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={check.ok ? 'text-gray-300' : 'text-gray-500'}>{check.label}</span>
          </div>
        ))}
      </div>

      {/* Response time */}
      {data.response_time_ms > 0 && (
        <div className="text-xs text-gray-500">
          Response time: <span className={data.response_time_ms < 2000 ? 'text-green-400' : 'text-amber-400'}>
            {data.response_time_ms}ms
          </span>
        </div>
      )}

      {/* Issues list */}
      {data.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Issues ({criticalIssues.length} critical, {warningIssues.length} warnings)
          </p>
          {[...criticalIssues, ...warningIssues, ...infoIssues].map((issue, i) => {
            const config = SEVERITY_CONFIG[issue.severity];
            const Icon = config.icon;
            return (
              <div key={i} className={`p-3 rounded-lg border ${config.bg}`}>
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${config.color}`}>{issue.title}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${config.badge}`}>{issue.severity}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">{issue.message}</p>
                    {issue.recommendation && (
                      <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                        <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {issue.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WebsiteAuditSection;
