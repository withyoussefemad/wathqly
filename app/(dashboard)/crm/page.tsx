"use client";

import * as React from "react";
import {
  Users2,
  Building2,
  Plus,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  Briefcase,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Trash2,
  Calendar,
  Check,
  Building,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getCompaniesAction,
  createCompanyAction,
  deleteCompanyAction,
  getContactsAction,
  createContactAction,
  deleteContactAction,
  getDealsAction,
  createDealAction,
  updateDealStageAction,
  deleteDealAction,
  getCrmActivitiesAction,
  createCrmActivityAction,
  toggleCrmActivityAction,
  deleteCrmActivityAction,
  getCrmStatsAction,
} from "@/actions/crm";
import { PIPELINE_STAGES } from "@/features/crm/pipeline";
import type {
  Company,
  Contact,
  Deal,
  CrmActivity,
} from "@/lib/supabase/types";

export default function CRMPage() {
  const [activeTab, setActiveTab] = React.useState<"pipeline" | "contacts" | "companies" | "activities">("pipeline");
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [activities, setActivities] = React.useState<CrmActivity[]>([]);
  const [stats, setStats] = React.useState({
    totalPipelineValue: 0,
    totalWonValue: 0,
    openDealsCount: 0,
    wonDealsCount: 0,
    totalContacts: 0,
    totalCompanies: 0,
    pendingActivities: 0,
  });
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog States
  const [openDealModal, setOpenDealModal] = React.useState(false);
  const [openContactModal, setOpenContactModal] = React.useState(false);
  const [openCompanyModal, setOpenCompanyModal] = React.useState(false);
  const [openActivityModal, setOpenActivityModal] = React.useState(false);

  // New Deal Form State
  const [dealTitle, setDealTitle] = React.useState("");
  const [dealValue, setDealValue] = React.useState("50000");
  const [dealStage, setDealStage] = React.useState("lead");
  const [dealCompanyId, setDealCompanyId] = React.useState("");
  const [dealPriority, setDealPriority] = React.useState<"low" | "medium" | "high" | "urgent">("high");

  // New Contact Form State
  const [contactFirst, setContactFirst] = React.useState("");
  const [contactLast, setContactLast] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactTitle, setContactTitle] = React.useState("");
  const [contactCompanyId, setContactCompanyId] = React.useState("");

  // New Company Form State
  const [companyName, setCompanyName] = React.useState("");
  const [companyDomain, setCompanyDomain] = React.useState("");
  const [companyIndustry, setCompanyIndustry] = React.useState("");
  const [companySize, setCompanySize] = React.useState<"1-10" | "11-50" | "51-200" | "201-1000" | "1000+">("51-200");
  const [companyStatus, setCompanyStatus] = React.useState<"lead" | "customer" | "partner">("lead");

  // New Activity Form State
  const [activityTitle, setActivityTitle] = React.useState("");
  const [activityType, setActivityType] = React.useState<"call" | "email" | "meeting" | "task">("meeting");
  const [activityDealId, setActivityDealId] = React.useState("");
  const [activityDueDate, setActivityDueDate] = React.useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );

  const loadData = React.useCallback(async () => {
    try {
      const [dealsData, contactsData, companiesData, activitiesData, statsData] = await Promise.all([
        getDealsAction(),
        getContactsAction(),
        getCompaniesAction(),
        getCrmActivitiesAction(),
        getCrmStatsAction(),
      ]);
      setDeals(dealsData);
      setContacts(contactsData);
      setCompanies(companiesData);
      setActivities(activitiesData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load CRM data");
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Deal Handlers
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim()) {
      toast.error("Please enter a deal title");
      return;
    }

    const res = await createDealAction({
      title: dealTitle.trim(),
      value: Number(dealValue) || 0,
      stage: dealStage,
      companyId: dealCompanyId || null,
      priority: dealPriority,
    });

    if (res.success && res.data) {
      toast.success("Deal created successfully");
      setOpenDealModal(false);
      setDealTitle("");
      loadData();
    } else {
      toast.error("Failed to create deal");
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: newStage as Deal["stage"],
              status: newStage === "won" ? "won" : newStage === "lost" ? "lost" : "open",
            }
          : d
      )
    );

    const res = await updateDealStageAction(dealId, newStage);
    if (res.success) {
      toast.success(`Deal moved to ${newStage.toUpperCase()}`);
      loadData();
    } else {
      toast.error("Failed to update deal stage");
      loadData();
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));
    await deleteDealAction(dealId);
    toast.success("Deal deleted");
    loadData();
  };

  // Contact Handlers
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFirst.trim() || !contactLast.trim()) {
      toast.error("Please enter first and last name");
      return;
    }

    const res = await createContactAction({
      firstName: contactFirst.trim(),
      lastName: contactLast.trim(),
      email: contactEmail.trim() || undefined,
      phone: contactPhone.trim() || undefined,
      title: contactTitle.trim() || undefined,
      companyId: contactCompanyId || null,
      status: "lead",
    });

    if (res.success && res.data) {
      toast.success("Contact added successfully");
      setOpenContactModal(false);
      setContactFirst("");
      setContactLast("");
      setContactEmail("");
      loadData();
    } else {
      toast.error("Failed to add contact");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    await deleteContactAction(contactId);
    toast.success("Contact removed");
    loadData();
  };

  // Company Handlers
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter company name");
      return;
    }

    const res = await createCompanyAction({
      name: companyName.trim(),
      domain: companyDomain.trim() || undefined,
      industry: companyIndustry.trim() || undefined,
      size: companySize,
      status: companyStatus,
    });

    if (res.success && res.data) {
      toast.success("Company created successfully");
      setOpenCompanyModal(false);
      setCompanyName("");
      loadData();
    } else {
      toast.error("Failed to create company");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    await deleteCompanyAction(companyId);
    toast.success("Company removed");
    loadData();
  };

  // Activity Handlers
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) {
      toast.error("Please enter activity title");
      return;
    }

    const res = await createCrmActivityAction({
      title: activityTitle.trim(),
      type: activityType,
      dealId: activityDealId || null,
      dueDate: activityDueDate ? new Date(activityDueDate).toISOString() : null,
      completed: false,
    });

    if (res.success && res.data) {
      toast.success("Follow-up scheduled");
      setOpenActivityModal(false);
      setActivityTitle("");
      loadData();
    } else {
      toast.error("Failed to schedule activity");
    }
  };

  const handleToggleActivity = async (activityId: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, completed: !a.completed } : a))
    );
    await toggleCrmActivityAction(activityId);
    toast.success("Activity status updated");
    loadData();
  };

  // Filtered Items
  const filteredDeals = React.useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const q = searchQuery.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.company?.name.toLowerCase().includes(q) ||
        d.stage.toLowerCase().includes(q)
    );
  }, [deals, searchQuery]);

  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.name.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const filteredCompanies = React.useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q)
    );
  }, [companies, searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-primary" />
            <span>CRM &amp; Sales Pipeline</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise relationship graph: Accounts, decision makers, deal stages, and execution follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setOpenCompanyModal(true)}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Add Company</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setOpenContactModal(true)}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Add Contact</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setOpenDealModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Active Pipeline</span>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono">
              ${stats.totalPipelineValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {stats.openDealsCount} open opportunities
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Won Revenue</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-success">
              ${stats.totalWonValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {stats.wonDealsCount} contracts closed
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Accounts &amp; Contacts</span>
              <Building className="h-3.5 w-3.5 text-info" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono">
              {stats.totalCompanies} / {stats.totalContacts}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Companies / Key contacts
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Pending Follow-ups</span>
              <Clock className="h-3.5 w-3.5 text-warning" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-warning">
              {stats.pendingActivities}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Awaiting executive action
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pipeline" | "contacts" | "companies" | "activities")} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/40">
            <TabsTrigger value="pipeline" className="gap-2 text-xs">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Deal Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2 text-xs">
              <Users2 className="h-3.5 w-3.5" />
              <span>Contacts ({contacts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span>Companies ({companies.length})</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>Follow-ups ({activities.filter((a) => !a.completed).length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CRM..."
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
        </div>

        {/* 1. PIPELINE KANBAN VIEW */}
        <TabsContent value="pipeline" className="m-0">
          <div className="overflow-x-auto pb-4">
            <div className="inline-flex gap-3 min-w-full">
              {PIPELINE_STAGES.map((stage) => {
                const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
                const stageSum = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

                return (
                  <div
                    key={stage.id}
                    className="w-72 shrink-0 bg-secondary/20 rounded-xl border border-border/60 flex flex-col max-h-187.5"
                  >
                    {/* Stage Header */}
                    <div className="p-3 border-b border-border/40 bg-card/40 rounded-t-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">
                          {stage.label}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-mono font-normal">
                          {stageDeals.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono font-medium text-foreground">
                          ${stageSum.toLocaleString()}
                        </span>
                        <span>{stage.probability}% win prob</span>
                      </div>
                    </div>

                    {/* Stage Deal Cards */}
                    <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                      {stageDeals.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
                          No deals in this stage
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <Card
                            key={deal.id}
                            className="p-3 bg-card border-border/70 hover:border-primary/50 shadow-sm transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                                {deal.title}
                              </p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                  <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
                                    Move to Stage
                                  </div>
                                  {PIPELINE_STAGES.map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={() => handleStageChange(deal.id, s.id)}
                                      className={deal.stage === s.id ? "font-bold text-primary" : ""}
                                    >
                                      {s.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDeal(deal.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Deal
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {deal.company && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{deal.company.name}</span>
                              </div>
                            )}

                            {deal.contact && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <UserCheck className="h-3 w-3" />
                                <span className="truncate">
                                  {deal.contact.first_name} {deal.contact.last_name}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40 text-xs">
                              <span className="font-mono font-bold text-foreground">
                                ${Number(deal.value || 0).toLocaleString()}
                              </span>
                              <Badge
                                variant={
                                  deal.priority === "urgent"
                                    ? "destructive"
                                    : deal.priority === "high"
                                    ? "accent"
                                    : "secondary"
                                }
                                className="text-[9px] uppercase tracking-wide px-1.5 py-0"
                              >
                                {deal.priority}
                              </Badge>
                            </div>

                            {/* Quick Next Stage Action Button */}
                            <div className="mt-2 pt-1.5 flex gap-1">
                              {stage.id !== "won" && stage.id !== "lost" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-full text-[10px] gap-1 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => {
                                      const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === stage.id);
                                      if (currentIndex < PIPELINE_STAGES.length - 2) {
                                        handleStageChange(deal.id, PIPELINE_STAGES[currentIndex + 1].id);
                                      }
                                    }}
                                  >
                                    <span>Advance</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-success hover:bg-success/10"
                                    onClick={() => handleStageChange(deal.id, "won")}
                                  >
                                    Won
                                  </Button>
                                </>
                              )}
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* 2. CONTACTS DIRECTORY VIEW */}
        <TabsContent value="contacts" className="m-0">
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Key Contacts &amp; Decision Makers</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct relationship history, email addresses, and title roles across accounts.
                </p>
              </div>
              <Button size="sm" onClick={() => setOpenContactModal(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {filteredContacts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No contacts found. Click &quot;Add Contact&quot; to create one.
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        {contact.first_name[0]}
                        {contact.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <Badge
                            variant={contact.status === "active" ? "success" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {contact.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contact.title || "No Title"} •{" "}
                          <span className="font-medium text-foreground">
                            {contact.company?.name || "Independent"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>{contact.email}</span>
                        </a>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </span>
                      )}
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. COMPANIES DIRECTORY VIEW */}
        <TabsContent value="companies" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const compDeals = deals.filter((d) => d.company_id === comp.id);
              const compContacts = contacts.filter((c) => c.company_id === comp.id);
              const totalVal = compDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

              return (
                <Card key={comp.id} className="border-border/80 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {comp.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {comp.industry || "Enterprise"} • {comp.size || "1-50"} employees
                        </p>
                      </div>
                      <Badge
                        variant={comp.status === "customer" ? "success" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {comp.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {comp.notes && (
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {comp.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Associated Deals:</span>
                        <p className="font-mono font-bold text-foreground mt-0.5">
                          ${totalVal.toLocaleString()} ({compDeals.length})
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contacts:</span>
                        <p className="font-semibold text-foreground mt-0.5">
                          {compContacts.length} key stakeholders
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      {comp.website ? (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{comp.domain || "Website"}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No website</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteCompany(comp.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 4. ACTIVITIES & CRM FOLLOW-UPS VIEW */}
        <TabsContent value="activities" className="m-0">
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">CRM Activities &amp; Follow-ups</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scheduled calls, client check-ins, proposal follow-ups, and meeting commitments.
                </p>
              </div>
              <Button size="sm" onClick={() => setOpenActivityModal(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Schedule Follow-up</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No activities scheduled. Click &quot;Schedule Follow-up&quot; to create one.
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      act.completed ? "bg-secondary/10 opacity-70" : "hover:bg-secondary/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleActivity(act.id)}
                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                          act.completed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {act.completed && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-medium ${
                              act.completed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {act.title}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {act.type}
                          </Badge>
                        </div>
                        {act.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                        )}
                        {act.deal && (
                          <p className="text-xs text-primary/80 mt-1">
                            Deal: {act.deal.title}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {act.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" />
                          {new Date(act.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setActivities((prev) => prev.filter((a) => a.id !== act.id));
                          deleteCrmActivityAction(act.id);
                          toast.success("Activity deleted");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE DEAL MODAL */}
      <Dialog open={openDealModal} onOpenChange={setOpenDealModal}>
        <DialogContent className="sm:max-w-120">
          <form onSubmit={handleCreateDeal}>
            <DialogHeader>
              <DialogTitle className="text-lg">Create New Deal Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Deal Title</label>
                <Input
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  placeholder="e.g. Enterprise Workspace Rollout"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Value (USD)</label>
                  <Input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Initial Stage</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.probability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Associated Company</label>
                  <select
                    value={dealCompanyId}
                    onChange={(e) => setDealCompanyId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">No Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Priority</label>
                  <select
                    value={dealPriority}
                    onChange={(e) => setDealPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenDealModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE CONTACT MODAL */}
      <Dialog open={openContactModal} onOpenChange={setOpenContactModal}>
        <DialogContent className="sm:max-w-120">
          <form onSubmit={handleCreateContact}>
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">First Name</label>
                  <Input
                    value={contactFirst}
                    onChange={(e) => setContactFirst(e.target.value)}
                    placeholder="First name"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Last Name</label>
                  <Input
                    value={contactLast}
                    onChange={(e) => setContactLast(e.target.value)}
                    placeholder="Last name"
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Email</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Phone</label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+966 ..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Job Title</label>
                  <Input
                    value={contactTitle}
                    onChange={(e) => setContactTitle(e.target.value)}
                    placeholder="VP, Director, etc."
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Company</label>
                  <select
                    value={contactCompanyId}
                    onChange={(e) => setContactCompanyId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">No Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenContactModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE COMPANY MODAL */}
      <Dialog open={openCompanyModal} onOpenChange={setOpenCompanyModal}>
        <DialogContent className="sm:max-w-120">
          <form onSubmit={handleCreateCompany}>
            <DialogHeader>
              <DialogTitle className="text-lg">Add New Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Aramco Digital"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Domain / Website</label>
                  <Input
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="company.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Industry</label>
                  <Input
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="AI, Cloud, FinTech"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value as "1-10" | "11-50" | "51-200" | "201-1000" | "1000+")}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Status</label>
                  <select
                    value={companyStatus}
                    onChange={(e) => setCompanyStatus(e.target.value as "lead" | "customer" | "partner")}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="lead">Lead Account</option>
                    <option value="customer">Active Customer</option>
                    <option value="partner">Strategic Partner</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenCompanyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE ACTIVITY MODAL */}
      <Dialog open={openActivityModal} onOpenChange={setOpenActivityModal}>
        <DialogContent className="sm:max-w-120">
          <form onSubmit={handleCreateActivity}>
            <DialogHeader>
              <DialogTitle className="text-lg">Schedule CRM Follow-up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Title / Action</label>
                <Input
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="e.g. Follow-up email with revised pricing"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Activity Type</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as "call" | "email" | "meeting" | "task")}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={activityDueDate}
                    onChange={(e) => setActivityDueDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Link to Deal (Optional)</label>
                <select
                  value={activityDealId}
                  onChange={(e) => setActivityDealId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No Deal</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} (${Number(d.value).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenActivityModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Schedule Action
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
