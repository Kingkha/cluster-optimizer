"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClusterNodeData } from "@/lib/types";

const roles = [
  "pillar",
  "sub-pillar",
  "support",
  "comparison",
  "list",
  "informational",
];

const intents = ["informational", "commercial", "transactional", "navigational"];

export function NodeEditor({
  node,
  allNodes,
  onClose,
  onSaved,
}: {
  node: ClusterNodeData;
  allNodes: ClusterNodeData[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [role, setRole] = useState(node.role);
  const [parentId, setParentId] = useState(node.parentId || "none");
  const [targetKeyword, setTargetKeyword] = useState(
    node.targetKeyword || ""
  );
  const [searchIntent, setSearchIntent] = useState(
    node.searchIntent || "informational"
  );
  const [notes, setNotes] = useState(node.notes || "");
  const [saving, setSaving] = useState(false);

  const possibleParents = allNodes.filter((n) => n.id !== node.id);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/nodes/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        role,
        parentId: parentId === "none" ? null : parentId,
        targetKeyword: targetKeyword || null,
        searchIntent,
        notes: notes || null,
      }),
    });
    onSaved();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${node.title}"? This will also remove its links.`)) {
      return;
    }
    await fetch(`/api/nodes/${node.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Intent</Label>
              <Select value={searchIntent} onValueChange={(v) => v && setSearchIntent(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intents.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Parent Node</Label>
            <Select value={parentId} onValueChange={(v) => v && setParentId(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (root)</SelectItem>
                {possibleParents.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Keyword</Label>
            <Input
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              placeholder="Primary keyword to target"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
