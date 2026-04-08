import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

const meta: Meta = {
  title: 'Feedback/Sheet',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" defaultValue="john@example.com" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button variant="primary">Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse through sections.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 py-4">
          {['Dashboard', 'Agents', 'Providers', 'Settings'].map(item => (
            <Button key={item} variant="ghost" className="justify-start">
              {item}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Announcement</SheetTitle>
          <SheetDescription>
            Important system notification.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
          <SheetDescription>Choose an action to perform.</SheetDescription>
        </SheetHeader>
        <div className="flex gap-2 py-4">
          <Button variant="outline" className="flex-1">
            Export
          </Button>
          <Button variant="primary" className="flex-1">
            Share
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
