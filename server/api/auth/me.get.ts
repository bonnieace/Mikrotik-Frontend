import { defineEventHandler } from 'h3'
import { backend, session } from '../../utils/backend'
import type { Operator } from '../../../shared/types'
export default defineEventHandler(event => backend<Operator>(event, 'me', 'GET', undefined, session(event)))
