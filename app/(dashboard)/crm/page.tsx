import { Users2, Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CRMPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-primary" />
            <span>CRM &amp; Relationships</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage contacts, companies, lead pipelines, and deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            <span>Companies</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground">Total Contacts</span>
            <CardTitle className="text-2xl font-bold">142</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground">Active Pipelines</span>
            <CardTitle className="text-2xl font-bold">3</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <span className="text-xs text-muted-foreground">Pipeline Value</span>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$84,000</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">Recent Leads &amp; Deals</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {[
            { name: "Acme Enterprise", contact: "John Smith", stage: "Proposal Sent", value: "$30,000" },
            { name: "TechNova Inc", contact: "Sarah Connor", stage: "Discovery Call", value: "$18,000" },
            { name: "Apex Global", contact: "David Vance", stage: "Negotiation", value: "$36,000" },
          ].map((lead, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-xs text-muted-foreground">{lead.contact}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">{lead.stage}</Badge>
                <span className="text-xs font-mono font-medium">{lead.value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
