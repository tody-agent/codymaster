import Ajv, { type SchemaObject } from 'ajv';
import type { Request, Response, NextFunction } from 'express';

const ajv = new Ajv();

export function validateBody(schema: SchemaObject) {
  const validate = ajv.compile(schema);
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!validate(req.body)) {
      res.status(400).json({ error: 'Validation failed', details: validate.errors });
      return;
    }
    next();
  };
}
