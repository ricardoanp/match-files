import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('phone').nullable();
    table.string('password_hash').notNullable();
    table.specificType('roles', 'text[]').notNullable().defaultTo(['JOGADOR']);
    table.enum('status', ['active', 'suspended']).defaultTo('active');
    table.json('location').nullable();
    table.json('consent').notNullable().defaultTo({
      marketing: false,
      sms: false,
      push: true,
    });
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('email');
  });

  // Courts table
  await knex.schema.createTable('courts', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.string('name').notNullable();
    table.string('partner_name').notNullable();
    table.json('address').notNullable();
    table.json('geo').notNullable();
    table.specificType('sports', 'text[]').notNullable();
    table.json('amenities').notNullable().defaultTo([]);
    table.string('timezone').notNullable().defaultTo('America/Sao_Paulo');
    table.json('contact').notNullable();
    table.uuid('owner_user_id').notNullable().references('users.id');
    table.enum('status', ['active', 'inactive', 'blocked']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('owner_user_id');
    table.index('status');
  });

  // IdleSlots table
  await knex.schema.createTable('idle_slots', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('court_id').notNullable().references('courts.id');
    table.string('sport').notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.integer('price_brl').notNullable(); // Store as cents
    table.integer('capacity').notNullable().defaultTo(4);
    table.integer('available_spots').notNullable();
    table.enum('status', ['open', 'full', 'cancelled', 'closed']).defaultTo('open');
    table.enum('visibility', ['public', 'hidden']).defaultTo('public');
    table.json('rules').notNullable().defaultTo({ cancelWindowHours: 24, refundPolicy: '80%' });
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('court_id');
    table.index('start_time');
    table.index('status');
  });

  // DayUseEvents table
  await knex.schema.createTable('day_use_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('court_id').notNullable().references('courts.id');
    table.string('name').notNullable();
    table.string('sport').notNullable();
    table.date('date').notNullable();
    table.string('start_time').notNullable(); // HH:mm format
    table.string('end_time').notNullable();
    table.integer('price_per_player_brl').notNullable(); // cents
    table.integer('max_participants').notNullable();
    table.integer('current_participants').defaultTo(0);
    table.boolean('jogos_aula_enabled').defaultTo(false);
    table.enum('jogos_aula_price_mode', ['per_person', 'per_slot']).nullable();
    table.integer('jogos_aula_price_brl').nullable();
    table.enum('status', ['scheduled', 'ongoing', 'finished', 'cancelled']).defaultTo('scheduled');
    table.json('rules').notNullable().defaultTo({ cancelWindowHours: 48, refundPolicy: '70%' });
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('court_id');
    table.index('date');
    table.index('status');
  });

  // Professors table
  await knex.schema.createTable('professors', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.text('bio').nullable();
    table.specificType('sports', 'text[]').notNullable();
    table.boolean('verified').defaultTo(false);
    table.json('rate_info').notNullable().defaultTo({});
    table.decimal('rating_avg', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('user_id');
    table.unique('user_id');
  });

  // ProfessorEventLinks table
  await knex.schema.createTable('professor_event_links', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('professor_id').notNullable().references('professors.id');
    table.uuid('event_id').notNullable().references('day_use_events.id');
    table.enum('status', ['invited', 'accepted', 'declined', 'cancelled']).defaultTo('invited');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('professor_id');
    table.index('event_id');
  });

  // JogosAulaSlots table
  await knex.schema.createTable('jogos_aula_slots', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('event_id').notNullable().references('day_use_events.id');
    table.uuid('court_id').notNullable().references('courts.id');
    table.uuid('professor_id').notNullable().references('professors.id');
    table.string('start_time').notNullable(); // HH:mm
    table.string('end_time').notNullable();
    table.integer('capacity').defaultTo(4);
    table.integer('filled').defaultTo(0);
    table.enum('status', ['open', 'full', 'cancelled', 'finished']).defaultTo('open');
    table.integer('buffer_minutes').defaultTo(10);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('event_id');
    table.index('professor_id');
  });

  // Bookings table
  await knex.schema.createTable('bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.enum('type', ['idle_slot', 'day_use']).notNullable();
    table.uuid('item_id').notNullable();
    table.integer('quantity').defaultTo(1);
    table.integer('unit_price_brl').notNullable();
    table.integer('total_brl').notNullable();
    table.uuid('payment_id').nullable();
    table.enum('status', ['pending', 'paid', 'cancelled', 'refunded', 'no_show']).defaultTo('pending');
    table.timestamp('check_in_at').nullable();
    table.timestamp('check_out_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('user_id');
    table.index('type');
    table.index('status');
  });

  // JogosAulaBookings table
  await knex.schema.createTable('jogos_aula_bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.uuid('slot_id').notNullable().references('jogos_aula_slots.id');
    table.integer('unit_price_brl').notNullable();
    table.integer('total_brl').notNullable();
    table.uuid('payment_id').nullable();
    table.enum('status', ['pending', 'paid', 'cancelled', 'refunded', 'no_show']).defaultTo('pending');
    table.timestamp('check_in_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('user_id');
    table.index('slot_id');
  });

  // Payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('booking_id').nullable().references('bookings.id');
    table.uuid('jogos_aula_booking_id').nullable().references('jogos_aula_bookings.id');
    table.uuid('user_id').notNullable().references('users.id');
    table.integer('total_brl').notNullable();
    table.enum('status', ['pending', 'captured', 'failed', 'refunded']).defaultTo('pending');
    table.string('provider_ref').nullable();
    table.string('method').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('user_id');
    table.index('status');
  });

  // Settlements table
  await knex.schema.createTable('settlements', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('payment_id').notNullable().references('payments.id');
    table.json('distribution').notNullable();
    table.boolean('settled').defaultTo(false);
    table.timestamp('settled_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('payment_id');
  });

  // PenaltyLogs table
  await knex.schema.createTable('penalty_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.enum('reason', ['late_cancel', 'no_show']).notNullable();
    table.enum('source', ['idle_slot', 'day_use', 'jogos_aula']).notNullable();
    table.uuid('item_id').notNullable();
    table.integer('score_delta').notNullable();
    table.timestamp('valid_until').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('valid_until');
  });

  // MatchRequests table
  await knex.schema.createTable('match_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.string('sport').notNullable();
    table.enum('level', ['iniciante', 'intermediario', 'avancado']).notNullable();
    table.enum('mode', ['solo', 'dupla']).notNullable();
    table.json('preferred_window').notNullable();
    table.integer('radius_km').notNullable().defaultTo(20);
    table.enum('status', ['open', 'matched', 'expired', 'cancelled']).defaultTo('open');
    table.specificType('matched_with', 'uuid[]').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index('user_id');
    table.index('sport');
    table.index('status');
  });

  // NotificationLogs table
  await knex.schema.createTable('notification_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuidv4());
    table.uuid('user_id').notNullable().references('users.id');
    table.enum('channel', ['push', 'email', 'sms']).notNullable();
    table.string('template_id').notNullable();
    table.json('payload_json').notNullable();
    table.timestamp('sent_at').nullable();
    table.enum('status', ['queued', 'sent', 'failed']).defaultTo('queued');
    table.text('error').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('user_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_logs');
  await knex.schema.dropTableIfExists('match_requests');
  await knex.schema.dropTableIfExists('penalty_logs');
  await knex.schema.dropTableIfExists('settlements');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('jogos_aula_bookings');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('jogos_aula_slots');
  await knex.schema.dropTableIfExists('professor_event_links');
  await knex.schema.dropTableIfExists('professors');
  await knex.schema.dropTableIfExists('day_use_events');
  await knex.schema.dropTableIfExists('idle_slots');
  await knex.schema.dropTableIfExists('courts');
  await knex.schema.dropTableIfExists('users');
}
