import {
    trigger, animateChild, group, stagger,
    transition, animate, style, query
} from '@angular/animations';

// Animations come in many types;
// - pageAnimations defines loading the page, in Angular this should only be used once if routes are effectively used to navigate
// - routeAnimation defines loading router transitions through the angular router

// Routable animations
export const animations = [
    trigger('pageAnimations', [
        transition(':enter', [
            query('#routeBody, header, footer', [style({ opacity: 0 })], { optional: true }),
            query('header', [
                style({ opacity: 0, transform: 'translateX(-150px)' }),
                stagger(-30, [
                    animate('700ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'none' }))
                ])
            ], { optional: true }), // This simply means if no DOM element is found matching, it's safe to skip the animation
            query('#routeBody', [
                style({ opacity: 0, transform: 'translateX(80px)' }),
                stagger(-30, [
                    animate('700ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'none' }))
                ])
            ], { optional: true }),
        ])
    ]),
    trigger('routeAnimation', [ // Routes work on a first-match basis. * means any state, <=> means between 2 states, => means to state. Other states include void, or css selectors
        transition('* => *', [
            // REQUIRED BY ANGULAR SPECIFICATIONS
            // Prevents unintended behaviour of static versus dynamic elements
            style({ position: 'relative' }),
            query(':leave, footer', [
                style({
                    position: 'absolute',
                    width: '100%',
                    right: '0%'
                })
            ], { optional: true }),

            // Of note: ':enter' must remain of type position 'relative' and width '100%' to ensure no footer clipping

            query(':enter', [style({ position: 'absolute', width: '100%', right: '0%', opacity: 0 })], { optional: true }),
            query('footer', [style({ opacity: 0 })], { optional: true }),
            group([
                query(':leave', [
                    style({ top: '0%', right: '-80%', opacity: 1, transform: 'translateX(-80%)' }),
                    animate('700ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 0, transform: 'none' })),
                    animateChild()
                ], { optional: true }),
                query(':enter', [ // works when set to absolute positioning?
                    style({ top: '0%', opacity: 0, transform: 'translateX(-16%)' }),
                    stagger(50, [
                        animate('700ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, position: 'relative', transform: 'none' })),
                    ]),
                    animateChild()
                ], { optional: true }),
            ]),
            query('footer', [
                style({ opacity: 0, transform: 'translateY(100px)' }),
                stagger(50, [
                    animate('1000ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'none' }))
                ])
            ])
        ])
    ])
];