import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function Users() {
    // Mock Data
    const [users] = useState([
        { id: 1, name: "Alice Johnson", email: "alice@example.com", plan: "Pro", status: "Active", lastActive: "2 mins ago" },
        { id: 2, name: "Bob Smith", email: "bob@design.co", plan: "Free", status: "Active", lastActive: "1 day ago" },
        { id: 3, name: "Charlie Brown", email: "charlie@gmail.com", plan: "Free", status: "Inactive", lastActive: "1 week ago" },
        { id: 4, name: "Diana Prince", email: "diana@themyscira.net", plan: "Pro", status: "Active", lastActive: "Just now" },
        { id: 5, name: "Evan Wright", email: "evan@studio.io", plan: "Pro", status: "Suspended", lastActive: "2 months ago" },
    ]);

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-muted-foreground">Manage authorized users and subscription tiers.</p>
                </div>
                <Button>Export CSV</Button>
            </div>

            <Table>
                <TableCaption>A list of your registered users.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.plan === 'Pro' ? 'default' : 'secondary'}>
                                    {user.plan}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center gap-1.5 ${user.status === 'Active' ? 'text-green-500' :
                                    user.status === 'Inactive' ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {user.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
