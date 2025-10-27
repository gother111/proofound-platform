"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Mail,
  ExternalLink,
  Plus,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface VerificationManagementProps {
  proofs: any[];
  verificationRequests: any[];
}

export function VerificationManagement({ proofs, verificationRequests }: VerificationManagementProps) {
  const router = useRouter();
  const [view, setView] = useState<'proofs' | 'requests'>('proofs');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge style={{ backgroundColor: '#7A927820', color: '#7A9278' }}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge style={{ backgroundColor: '#C76B4A20', color: '#C76B4A' }}>
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      {/* Header */}
      <div className="border-b px-6 py-6" style={{ borderColor: '#E8E6DD', backgroundColor: '#FDFCFA' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold" style={{ color: '#2D3330' }}>
                Proofs & Verifications
              </h1>
              <p className="text-sm mt-1" style={{ color: '#6B6760' }}>
                Manage your professional claims and verifications
              </p>
            </div>
            <Button
              onClick={() => router.push('/profile/proofs/new')}
              style={{ backgroundColor: '#1C4D3A', color: 'white' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit New Proof
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-4 mt-6">
            <Button
              variant={view === 'proofs' ? 'default' : 'ghost'}
              onClick={() => setView('proofs')}
              className={view === 'proofs' ? '' : ''}
              style={view === 'proofs' ? { backgroundColor: '#1C4D3A', color: 'white' } : {}}
            >
              <FileText className="w-4 h-4 mr-2" />
              My Proofs ({proofs.length})
            </Button>
            <Button
              variant={view === 'requests' ? 'default' : 'ghost'}
              onClick={() => setView('requests')}
              style={view === 'requests' ? { backgroundColor: '#1C4D3A', color: 'white' } : {}}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verification Requests ({verificationRequests.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'proofs' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                    Total Proofs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: '#1C4D3A' }} />
                    <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                      {proofs.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                    Verified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#7A9278' }} />
                    <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                      {proofs.filter(p => p.verification_status === 'approved').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-normal" style={{ color: '#6B6760' }}>
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" style={{ color: '#C76B4A' }} />
                    <span className="text-2xl font-display font-semibold" style={{ color: '#2D3330' }}>
                      {proofs.filter(p => p.verification_status === 'pending').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Proofs List */}
            {proofs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Proofs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proofs.map((proof) => (
                      <div
                        key={proof.id}
                        className="p-4 rounded-lg border"
                        style={{ borderColor: '#E8E6DD' }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {proof.claim_type?.replace('_', ' ')}
                              </Badge>
                              {getStatusBadge(proof.verification_status)}
                            </div>
                            <p className="text-sm mb-2" style={{ color: '#2D3330' }}>
                              {proof.claim_text}
                            </p>
                            {proof.artifact_url && (
                              <a
                                href={proof.artifact_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 hover:underline"
                                style={{ color: '#1C4D3A' }}
                              >
                                View supporting evidence
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <p className="text-xs mt-2" style={{ color: '#6B6760' }}>
                              Submitted {new Date(proof.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
                    No proofs yet
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#6B6760' }}>
                    Build credibility by submitting verified proofs of your skills and experience
                  </p>
                  <Button
                    onClick={() => router.push('/profile/proofs/new')}
                    style={{ backgroundColor: '#1C4D3A', color: 'white' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Proof
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {view === 'requests' && (
          <div>
            {verificationRequests.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {verificationRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-lg border"
                        style={{ borderColor: '#E8E6DD' }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(request.status)}
                              <span className="text-xs" style={{ color: '#6B6760' }}>
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback style={{ backgroundColor: '#5C8B89', color: 'white' }}>
                                  {request.verifier_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'V'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-sm font-medium" style={{ color: '#2D3330' }}>
                                  {request.verifier_name}
                                </h4>
                                <p className="text-xs" style={{ color: '#6B6760' }}>
                                  {request.verifier_email}
                                  {request.verifier_organization && ` • ${request.verifier_organization}`}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs" style={{ color: '#6B6760' }}>
                              Relationship: {request.verifier_relationship}
                            </p>
                            {request.status === 'pending' && (
                              <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: '#C76B4A10' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#C76B4A' }} />
                                <p className="text-xs" style={{ color: '#6B6760' }}>
                                  Waiting for response. You can resend the email if needed.
                                </p>
                              </div>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              <Mail className="w-4 h-4 mr-2" />
                              Resend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4" style={{ color: '#E8E6DD' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#2D3330' }}>
                    No verification requests
                  </h3>
                  <p className="text-sm" style={{ color: '#6B6760' }}>
                    Verification requests will appear here when you submit proofs that require referee verification
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

