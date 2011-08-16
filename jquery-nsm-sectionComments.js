(function($, undefined) {

	$.widget('NSM.sectionComments', {

		// all these "global" variables can be called like: this.blah
		// also this.element is the widget instance
		options: {
			animate: false,
			selectors: {
				section: '.entry-content-section',
				comments: '.comments',
				comment: '.comment',
				commentForm: '.comment-form',
				commentTotal: '.comment-total',
				parentCommentIdInput: 'input[name=parent_id]',
				sectionIdInput: 'input[name=row_id]',
				commentReplyTrigger: '.comment-reply-trigger'
				
			},
			classes: {
				commentTotal: 'comment-total',
				commentReplyTrigger: 'comment-reply-trigger'
			}
		},

		// this is an object of all our sections
		// the key is the section id
		sections: {},
		originalComments: false,

		// called once for each element
		_create: function () {
			// Cache the original comments so we don't get duplicates
			this.originalComments = $(this.options.selectors.comments, this.element);
			// Store the comment form
			this.form = this.originalComments.find('#comment-form');
		},

		// called everytime ‘.comments()’ is executed on an element.
		_init: function () {
			// Build the sections
			this._refresh();

			// Setup reply links for global comments
			this.originalComments.find('.comment').each($.proxy(function(i,el){
				var sectionId = el.getAttribute('data-sectionid');
				this._setupReplyLinks(sectionId,$(el));
			},this));		
		},
		
		// Refresh the section data
		_refresh: function(){
			
			// Grab the sections
			var $sections = $(this.options.selectors.section, this.element),
				$section,
				sectionId,
				$commentTotal,
				comments,
				totalComments,
				form;

			for (var i = $sections.length - 1; i >= 0; i--) {
				
				$section 		= $sections.eq(i);
				sectionId 		= $section.attr('data-sectionid');
				
				// No section ID
				if(!sectionId) continue;
				
				// Comments
				comments 		= this._getSectionComments(sectionId);
				totalComments	= comments.length;
				
				// Comment total text
				$commentTotal = $(this.options.selectors.commentTotal, $section);
				
				// Update the text
				$commentTotal.text(totalComments);
				
				// Setup the event for when you click the 'open' trigger for this section
				$commentTotal.bind('click', $.proxy(function(){
					this.toggleSectionComments(sectionId);
					return false;
				},this));
				
				// The comment form for this section
				form = this.form.clone();
				form.attr('id','comment-form-'+sectionId);
				
				// Setup the reply links
				this._setupReplyLinks(sectionId,comments);
				
				// Save the section
				this.sections[sectionId] = {
					
					// DOM element for this section
					element: $section,
					
					// DOM element for the total comment count
					commentTotalElement: $commentTotal,
										
					// Total comments for this section
					commentTotal: totalComments,
					
					// List of comments for this section
					comments: comments,
					
					// Have the comments been loaded into their section yet?
					commentsLoaded: false,
					
					// The comment form for this section
					form:form
				};
				
				this._setFormData(sectionId,0);
			}
		},
		
		// Return a list of DOM elements that are the comments for a section
		_getSectionComments: function(sectionId) {
			var commentList = this.originalComments.clone(true);
			commentList.find(this.options.selectors.comment+"[data-sectionId!="+sectionId+"]").remove();
			return commentList.find('.comment');
		},
		
		// Update the hidden field in a form for a section
		_setFormData: function(sectionId, parentId){
			
			var selectors 		= this.options.selectors,
				section			= this.sections[sectionId],
				form 			= section.form,
				sectionField 	= form.find(selectors.sectionIdInput),
				parentField 	= form.find(selectors.parentCommentIdInput);

			sectionField.val(sectionId);
			parentField.val(parentId);

			return true;
		},

		// Load the comments for the section
		loadSectionComments: function(sectionId) {
			var section		= this.sections[sectionId],
				comments 	= section.element.find('.comment-index');
			
			comments.append(section.comments);
			comments.after(section.form);

			return true;
		},

		// Loads the comments into the section
		toggleSectionComments: function(sectionId) {
			var section = this.sections[sectionId];
			
			if(section.commentsLoaded === false) {
				this.loadSectionComments(sectionId);
				section.commentsLoaded = true;
			}
			
			return true;
		},

		// Setup the events for the reply links for each comment
		_setupReplyLinks: function(sectionId,comments){
			
			var $replyLinks = $(this.options.selectors.commentReplyTrigger, comments);
			
			// When these are clicked, fire an event
			$replyLinks.bind('click', $.proxy(function(event){
				
				var target 		= $(event.target),
					commentId 	= target.attr('data-commentId');
						
				this._trigger('commentreply', event, {
					widget:this,
					sectionId:sectionId,
					commentId:commentId,
					target:target
				});
	
			},this));
			
			return true;
		},

		// Use the destroy method to reverse everything your plugin has applied
		destroy: function() {
			$.Widget.prototype.destroy.call(this);
		}

	});

})(jQuery);