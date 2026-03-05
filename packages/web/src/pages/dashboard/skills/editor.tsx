import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill, useSkill, useUpdateSkill } from '@/hooks/use-skills';

export default function SkillEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { data: existingSkill, isLoading: isLoadingSkill } = useSkill(id);
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingSkill) {
      setName(existingSkill.name);
      setDescription(existingSkill.description ?? '');
      setTagsInput(existingSkill.tags.join(', '));
      setContent(existingSkill.content);
    }
  }, [existingSkill]);

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  const isFormValid = name.trim().length > 0 && content.trim().length > 0;
  const isSaving = createSkill.isPending || updateSkill.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSaving) return;
    setError(null);

    const tags = parseTags(tagsInput);

    try {
      if (isEditMode) {
        await updateSkill.mutateAsync({
          id,
          dto: {
            name: name.trim(),
            description: description.trim() || undefined,
            content: content.trim(),
            tags,
          },
        });
      } else {
        await createSkill.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
          tags,
        });
      }
      await navigate('/skills');
    } catch {
      setError(
        isEditMode
          ? 'Failed to update skill. Please try again.'
          : 'Failed to create skill. Please try again.'
      );
    }
  }

  if (isEditMode && isLoadingSkill) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Loading skill...</div>
      </div>
    );
  }

  if (isEditMode && !isLoadingSkill && !existingSkill) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Skill not found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The skill you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate('/skills')}>
          Back to Skills
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/skills')}
          aria-label="Back to skills"
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? 'Edit Skill' : 'Create Skill'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? 'Update your skill configuration.'
              : 'Define a new skill for your agents.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>Skill Details</CardTitle>
            <CardDescription>
              Configure the skill name, tags, and content.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Code Review Guidelines"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                A descriptive name for this skill.
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this skill does..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Optional description of the skill&apos;s purpose.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g., code-review, best-practices, testing"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-muted-foreground text-xs">
                Comma-separated list of tags for categorization.
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the skill content..."
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={isSaving}
                required
                rows={16}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                The full skill content that will be provided to agents.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/skills')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="gradient-bg text-white hover:opacity-90 cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Skill'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
