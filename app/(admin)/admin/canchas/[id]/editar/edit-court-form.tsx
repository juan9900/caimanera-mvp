"use client";

import { useActionState } from "react";
import { updateCourt } from "@/app/actions/courts";
import { CourtSponsorshipFields } from "@/components/courts/court-form-fields";
import { Card, CardHeader, CardBody } from "@/components/admin/ui/card";
import { Field, Input } from "@/components/admin/ui/field";
import { Button } from "@/components/admin/ui/button";
import type { Court } from "@/lib/auth/dal";

export function EditCourtForm({ court }: { court: Court }) {
  const [state, action, pending] = useActionState(updateCourt.bind(null, court.id), undefined);

  return (
    <form action={action} className="space-y-5">
      <Card>
        <CardHeader title="Datos básicos" />
        <CardBody className="space-y-4">
          <Field label="Nombre" htmlFor="name" error={state?.errors?.name?.[0]}>
            <Input id="name" name="name" defaultValue={court.name} />
          </Field>

          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Latitud" htmlFor="lat" error={state?.errors?.lat?.[0]}>
                <Input id="lat" name="lat" type="number" step="any" defaultValue={court.lat} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Longitud" htmlFor="lng" error={state?.errors?.lng?.[0]}>
                <Input id="lng" name="lng" type="number" step="any" defaultValue={court.lng} />
              </Field>
            </div>
          </div>

          <Field label="Dirección (opcional)" htmlFor="address" error={state?.errors?.address?.[0]}>
            <Input
              id="address"
              name="address"
              defaultValue={court.address ?? ""}
              placeholder="Ej: Av. 15 Las Delicias, Maracaibo"
            />
          </Field>

          <Field label="Horario (opcional)" htmlFor="schedule">
            <Input id="schedule" name="schedule" defaultValue={court.schedule ?? ""} />
          </Field>

          <Field label="Teléfono de contacto (opcional)" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" defaultValue={court.contact_phone ?? ""} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ficha, comodidades y patrocinio" />
        <CardBody className="space-y-4">
          <CourtSponsorshipFields
            defaultValues={{
              logoUrl: court.logo_url,
              photos: court.photos,
              whatsappUrl: court.whatsapp_url,
              bookingUrl: court.booking_url,
              amenities: court.amenities,
              sports: court.sports,
              isPublic: court.is_public,
              sponsorPriority: court.sponsor_priority,
              promoText: court.promo_text,
              promoCode: court.promo_code,
              promoExpiresAt: court.promo_expires_at,
            }}
            errors={state?.errors}
          />
        </CardBody>
      </Card>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
