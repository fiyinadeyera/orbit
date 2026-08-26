import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { 
  useGetPerson, 
  useUpdatePerson, 
  useDeletePerson, 
  useCreateInteraction,
  getGetPersonQueryKey,
  getListPeopleQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { getInitials, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, Edit2, Trash2, MapPin, Building, Briefcase, 
  Calendar, Network, FileText, Plus, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: person, isLoading } = useGetPerson(id!);
  
  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();
  const addInteractionMutation = useCreateInteraction();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newInteraction, setNewInteraction] = useState('');

  if (isLoading) {
    return <div className="space-y-8 animate-pulse">
      <div className="h-8 w-24 bg-muted rounded" />
      <div className="flex gap-6 items-start">
        <div className="w-24 h-24 rounded-full bg-muted" />
        <div className="space-y-4 flex-1">
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded" />
        </div>
      </div>
    </div>;
  }

  if (!person) {
    return <div className="py-20 text-center text-muted-foreground">Person not found.</div>;
  }

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      company: formData.get('company') as string || undefined,
      role: formData.get('role') as string || undefined,
      location: formData.get('location') as string || undefined,
      howMet: formData.get('howMet') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)
    };

    updateMutation.mutate({ id: id!, data }, {
      onSuccess: () => {
        toast.success('Profile updated');
        setIsEditOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(id!) });
        queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this person? This cannot be undone.')) {
      deleteMutation.mutate({ id: id! }, {
        onSuccess: () => {
          toast.success('Person deleted');
          queryClient.invalidateQueries({ queryKey: getListPeopleQueryKey() });
          setLocation('/people');
        }
      });
    }
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteraction.trim()) return;

    addInteractionMutation.mutate({ 
      id: id!, 
      data: { 
        summary: newInteraction, 
        date: new Date().toISOString() 
      } 
    }, {
      onSuccess: () => {
        toast.success('Interaction recorded');
        setNewInteraction('');
        queryClient.invalidateQueries({ queryKey: getGetPersonQueryKey(id!) });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <Button variant="ghost" className="-ml-4 text-muted-foreground hover:text-foreground" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="flex flex-col md:flex-row gap-8 items-start relative">
        <div className="flex-1 flex gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-background shadow-lg">
            <AvatarFallback className="text-2xl">{getInitials(person.name)}</AvatarFallback>
          </Avatar>
          
          <div className="pt-2 flex-1">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{person.name}</h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
              {person.role && <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {person.role}</div>}
              {person.company && <div className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {person.company}</div>}
              {person.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {person.location}</div>}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {person.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-secondary/60 text-secondary-foreground font-medium">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input name="name" defaultValue={person.name} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <Input name="company" defaultValue={person.company || ''} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input name="role" defaultValue={person.role || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input name="location" defaultValue={person.location || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">How we met</label>
                  <Input name="howMet" defaultValue={person.howMet || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (comma separated)</label>
                  <Input name="tags" defaultValue={person.tags?.join(', ') || ''} />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
        
        {/* Left Column: Context & Notes */}
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-transparent shadow-none border-none">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Context
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {person.howMet && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">How we met</h4>
                  <p className="text-sm leading-relaxed">{person.howMet}</p>
                </div>
              )}
              {person.dateMet && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Date met</h4>
                  <p className="text-sm">{formatDate(person.dateMet)}</p>
                </div>
              )}
              {person.notes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Background notes</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{person.notes}</p>
                </div>
              )}
              {!person.howMet && !person.dateMet && !person.notes && (
                <p className="text-sm text-muted-foreground italic">No background context added.</p>
              )}
            </CardContent>
          </Card>

          {person.connections.length > 0 && (
            <Card className="bg-secondary/20 border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" /> Connected to
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.connections.map(conn => {
                  const isA = conn.personAId === person.id;
                  const otherId = isA ? conn.personBId : conn.personAId;
                  // In a real app we'd fetch the other person's name via graph or embed it.
                  // For now, we display the type.
                  return (
                    <div key={conn.id} className="text-sm p-2 bg-background rounded-md border border-border/50">
                      <span className="font-medium text-foreground">{conn.relationshipType}</span>
                      {conn.notes && <p className="text-xs text-muted-foreground mt-1">{conn.notes}</p>}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Interactions */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Interactions
            </h2>
          </div>

          <form onSubmit={handleAddInteraction} className="relative group">
            <Textarea 
              value={newInteraction}
              onChange={(e) => setNewInteraction(e.target.value)}
              placeholder="Log a new interaction..."
              className="min-h-[100px] pb-12 bg-card border-border/80 focus-visible:ring-primary/30"
              disabled={addInteractionMutation.isPending}
            />
            <div className="absolute bottom-2 right-2">
              <Button type="submit" size="sm" className="rounded-md h-8" disabled={!newInteraction.trim() || addInteractionMutation.isPending}>
                Record
              </Button>
            </div>
          </form>

          <div className="space-y-4 mt-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border/50">
            {person.interactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm relative z-10 bg-background">
                No recorded interactions yet.
              </div>
            ) : (
              person.interactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((interaction) => (
                <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                    <Calendar className="w-4 h-4" />
                  </div>
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/60 bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary">{formatDate(interaction.date)}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{interaction.summary}</p>
                    {interaction.rawNote && (
                      <p className="text-xs text-muted-foreground mt-2 border-t border-border/40 pt-2 line-clamp-2 italic">
                        "{interaction.rawNote}"
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}