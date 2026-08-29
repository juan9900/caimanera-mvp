"use client";

import { useActionState } from "react";
import { createCourt } from "@/app/actions/courts";
import { CourtSponsorshipFields } from "@/components/courts/court-form-fields";
import { Card, CardHeader, CardBody } from "@/components/admin/ui/card";
import { Field, Input } from "@/components/admin/ui/field";
import { Button } from "@/components/admin/ui/button";

export function AddCourtForm({
  initialValues,
  suggestionId,
}: {
  initialValues?: { name?: string; lat?: string; lng?: string };
  suggestionId?: string;
}) {
  const [state, action, pending] = useActionState(createCourt, undefined);

  return (
    <form action={action} className="space-y-5">
      {suggestionId && <input type="hidden" name="suggestionId" value={suggestionId} />}

      <Card>
        <CardHeader title="Datos básicos" />
        <CardBody className="space-y-4">
          <Field label="Nombre" htmlFor="name" error={state?.errors?.name?.[0]}>
            <Input
              id="name"
              name="name"
              defaultValue={initialValues?.name ?? ""}
              placeholder="Ej: Cancha Los Haticos"
            />
          </Field>

          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Latitud" htmlFor="lat" error={state?.errors?.lat?.[0]}>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  defaultValue={initialValues?.lat ?? ""}
                  placeholder="10.6316"
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Longitud" htmlFor="lng" error={state?.errors?.lng?.[0]}>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  defaultValue={initialValues?.lng ?? ""}
                  placeholder="-71.6444"
                />
              </Field>
            </div>
          </div>

          <Field label="Dirección (opcional)" htmlFor="address" error={state?.errors?.address?.[0]}>
            <Input id="address" name="address" placeholder="Ej: Av. 15 Las Delicias, Maracaibo" />
          </Field>

          <Field label="Horario (opcional)" htmlFor="schedule">
            <Input id="schedule" name="schedule" placeholder="Ej: Lun-Dom 6am-10pm" />
          </Field>

          <Field label="Teléfono de contacto (opcional)" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" placeholder="Ej: 0414-1234567" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ficha, comodidades y patrocinio" />
        <CardBody className="space-y-4">
          <CourtSponsorshipFields errors={state?.errors} />
        </CardBody>
      </Card>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Guardando..." : "Agregar cancha"}
      </Button>
    </form>
  );
}
