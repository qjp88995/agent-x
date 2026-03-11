import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { Check, ClipboardCopy } from 'lucide-react';

function CodeBlock({ code }: { readonly code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  return (
    <div className="relative">
      <pre className="bg-muted overflow-x-auto rounded-md p-4 font-mono text-sm leading-relaxed">
        {code}
      </pre>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <ClipboardCopy className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('common.copy')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function UsageDocs() {
  const { t } = useTranslation();
  const domain = window.location.origin;

  const curlChat = `curl ${domain}/v1/chat/completions \\
  -H "Authorization: Bearer sk-agx-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<version-id>",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'`;

  const curlModels = `curl ${domain}/v1/models \\
  -H "Authorization: Bearer sk-agx-..."`;

  const pythonExample = `from openai import OpenAI

client = OpenAI(
    api_key="sk-agx-...",
    base_url="${domain}/v1",
)

# ${t('apiKeys.usageListModels')}
models = client.models.list()
for model in models.data:
    print(f"{model.id} - {model.name}")

# ${t('apiKeys.usageChatStream')}
stream = client.chat.completions.create(
    model="<version-id>",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")`;

  const nodeExample = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-agx-...",
  baseURL: "${domain}/v1",
});

// ${t('apiKeys.usageListModels')}
const models = await client.models.list();
for (const model of models.data) {
  console.log(\`\${model.id} - \${model.name}\`);
}

// ${t('apiKeys.usageChatStream')}
const stream = await client.chat.completions.create({
  model: "<version-id>",
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
});
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}`;

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-2 text-lg font-semibold">{t('apiKeys.usage')}</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {t('apiKeys.usageDesc')}
      </p>

      <Tabs defaultValue="curl">
        <TabsList>
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="node">Node.js</TabsTrigger>
        </TabsList>

        <TabsContent value="curl" className="flex flex-col gap-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('apiKeys.usageChatCompletion')}
            </h4>
            <CodeBlock code={curlChat} />
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('apiKeys.usageListModels')}
            </h4>
            <CodeBlock code={curlModels} />
          </div>
        </TabsContent>

        <TabsContent value="python">
          <p className="text-muted-foreground mb-3 text-xs">
            pip install openai
          </p>
          <CodeBlock code={pythonExample} />
        </TabsContent>

        <TabsContent value="node">
          <p className="text-muted-foreground mb-3 text-xs">
            npm install openai
          </p>
          <CodeBlock code={nodeExample} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
