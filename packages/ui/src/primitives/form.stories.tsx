import { useForm } from 'react-hook-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';

const meta: Meta = {
  title: 'Primitives/Form',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const form = useForm({
      defaultValues: { username: '' },
    });

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(data => console.log(data))}
          className="w-80 space-y-4"
        >
          <FormField
            control={form.control}
            name="username"
            rules={{ required: 'Username is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="primary">
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};

export const WithValidation: Story = {
  render: () => {
    const form = useForm({
      defaultValues: { email: '', password: '' },
    });

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(data => console.log(data))}
          className="w-80 space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormDescription>
                  Must be at least 8 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="primary">
            Sign Up
          </Button>
        </form>
      </Form>
    );
  },
};
